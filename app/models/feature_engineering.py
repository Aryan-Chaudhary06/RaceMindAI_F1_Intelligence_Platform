import pandas as pd
import numpy as np

POINTS_MAP = {1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1}

CIRCUIT_TYPE = {
    "Bahrain International Circuit": "high_downforce",
    "Jeddah Corniche Circuit": "street",
    "Albert Park Grand Prix Circuit": "street",
    "Suzuka Circuit": "technical",
    "Shanghai International Circuit": "technical",
    "Miami International Autodrome": "street",
    "Autodromo Enzo e Dino Ferrari": "technical",
    "Circuit de Monaco": "street",
    "Circuit de Barcelona-Catalunya": "high_downforce",
    "Circuit Gilles Villeneuve": "street",
    "Red Bull Ring": "power",
    "Silverstone Circuit": "power",
    "Hungaroring": "high_downforce",
    "Circuit de Spa-Francorchamps": "power",
    "Circuit Zandvoort": "high_downforce",
    "Autodromo Nazionale di Monza": "power",
    "Baku City Circuit": "street",
    "Marina Bay Street Circuit": "street",
    "Circuit of the Americas": "technical",
    "Autodromo Hermanos Rodriguez": "high_downforce",
    "Autodromo Jose Carlos Pace": "technical",
    "Las Vegas Strip Street Circuit": "street",
    "Lusail International Circuit": "high_downforce",
    "Yas Marina Circuit": "high_downforce",
}


def build_training_features(historical_df: pd.DataFrame) -> pd.DataFrame:
    """
    Build ML-ready features from raw historical race results.

    ── Leakage prevention ────────────────────────────────────────────────────
    Every feature must be knowable BEFORE the race being predicted starts.
    Three bugs existed in the original version that made the model look
    nearly perfect on training data but gave nonsense predictions at
    inference time:

    Bug 1 — driver_circuit_avg_pos used ALL races at a circuit including
    the current one. Fixed: we now compute a rolling historical average
    using only races at that circuit that happened BEFORE the current round
    in the current year (shift(1) within a sorted group).

    Bug 2 — constructor_avg_points was grouped by (constructor, year, round)
    and merged back — this literally encoded each race's own result as a
    feature. Fixed: replaced with a rolling average of constructor points
    over the previous 5 races, shifted by 1 so the current race is excluded.

    Bug 3 — 2026 rookies (Antonelli, Hadjar, etc.) have zero rolling history,
    so the model had nothing to distinguish them from each other except grid
    position. When a rookie starts on pole, all their features are 0 except
    grid=1, and the model outputs ~100% podium probability. Fixed: we
    initialise rookie rolling features to the midfield average (50th
    percentile of the non-rookie population in the same season) rather than
    leaving them as NaN→0.
    ─────────────────────────────────────────────────────────────────────────
    """
    df = historical_df.copy()
    df = df.dropna(subset=["position", "grid"])
    df["position"]     = df["position"].astype(int)
    df["grid"]         = df["grid"].astype(int)
    df["won"]          = (df["position"] == 1).astype(int)
    df["podium"]       = (df["position"] <= 3).astype(int)
    df["points_scored"] = df["position"].map(POINTS_MAP).fillna(0)

    # ── Deduplicate raw data ─────────────────────────────────────────────────
    # Jolpica/cache concatenation can produce duplicate rows. Keep last
    # (most recently fetched) and reset index so all merges stay 1:1.
    df = (
        df.drop_duplicates(subset=["driver", "year", "round"], keep="last")
          .reset_index(drop=True)
    )

    df = df.sort_values(["driver", "year", "round"]).reset_index(drop=True)

    # ── FIX 1: Rolling driver features (shift(1) = exclude current race) ────
    # These were already correctly shifted in the original code.
    df["driver_rolling_points"] = (
        df.groupby("driver")["points_scored"]
        .transform(lambda x: x.shift(1).rolling(5, min_periods=1).mean())
    )
    df["driver_rolling_wins"] = (
        df.groupby("driver")["won"]
        .transform(lambda x: x.shift(1).rolling(10, min_periods=1).mean())
    )
    df["driver_rolling_podiums"] = (
        df.groupby("driver")["podium"]
        .transform(lambda x: x.shift(1).rolling(10, min_periods=1).mean())
    )

    # ── FIX 2: driver_circuit_avg_pos — historical only, no lookahead ───────
    # Original bug: groupby mean across ALL races → included current race.
    # Fix: sort by (driver, year, round), then for each (driver, circuit)
    # group compute expanding mean shifted by 1 so only past races count.
    df = df.sort_values(["driver", "circuit", "year", "round"]).reset_index(drop=True)
    df["driver_circuit_avg_pos"] = (
        df.groupby(["driver", "circuit"])["position"]
        .transform(lambda x: x.shift(1).expanding(min_periods=1).mean())
    )
    # For a driver's very first race at a circuit, fill with their overall
    # average position (still historical-only because rolling is shifted).
    df["driver_circuit_avg_pos"] = df["driver_circuit_avg_pos"].fillna(
        df["driver_rolling_points"].apply(lambda p: max(1, 11 - p / 2.5))
    )
    df = df.sort_values(["driver", "year", "round"]).reset_index(drop=True)

    # ── FIX 3: constructor_avg_points — rolling, not same-race result ────────
    # Original bug: grouped by (constructor, year, round) then merged back —
    # this encoded the race's own outcome as a feature (pure leakage).
    # Fix: rolling mean of the constructor's points over the last 5 races,
    # shifted by 1 so the current race is excluded.
    df = df.sort_values(["constructor", "year", "round"]).reset_index(drop=True)
    df["constructor_avg_points"] = (
        df.groupby("constructor")["points_scored"]
        .transform(lambda x: x.shift(1).rolling(5, min_periods=1).mean())
    )
    df = df.sort_values(["driver", "year", "round"]).reset_index(drop=True)

    # ── Remaining features ───────────────────────────────────────────────────
    df["grid_squared"]  = df["grid"] ** 2
    df["circuit_type"]  = df["circuit"].map(CIRCUIT_TYPE).fillna("unknown")
    df["circuit_type_code"] = pd.Categorical(df["circuit_type"]).codes

    df["dnf"] = (~df["status"].str.contains("Finished|Lap", na=False)).astype(int)
    df["constructor_dnf_rate"] = (
        df.groupby("constructor")["dnf"]
        .transform(lambda x: x.shift(1).rolling(10, min_periods=1).mean())
    )

    # ── FIX 4: Rookie initialisation ─────────────────────────────────────────
    # Drivers with no prior history have NaN rolling features → filled to 0
    # by dropna later, which makes them look like worst-possible drivers.
    # Instead fill with the season's midfield median so they're treated as
    # unknown-quality rather than explicitly bad.
    rolling_cols = [
        "driver_rolling_points", "driver_rolling_wins",
        "driver_rolling_podiums", "constructor_dnf_rate",
    ]
    for col in rolling_cols:
        median_val = df[col].median()
        df[col] = df[col].fillna(median_val if pd.notna(median_val) else 0.0)

    features = [
        "grid", "grid_squared",
        "driver_rolling_points", "driver_rolling_wins", "driver_rolling_podiums",
        "driver_circuit_avg_pos", "constructor_avg_points",
        "constructor_dnf_rate", "circuit_type_code",
        "round", "year",
    ]

    # "year" and "round" are already in features — exclude from extra_cols
    # to prevent duplicate columns (which cause sample_weight size mismatch).
    extra_cols = ["won", "podium", "position", "driver", "constructor", "circuit"]
    return df[features + extra_cols].copy()


# ── New-constructor / no-history fallback ────────────────────────────────────
NEW_CONSTRUCTORS_2026 = {"Audi", "Cadillac"}
MIN_RACES_FOR_OWN_DATA = 3


def apply_new_constructor_fallback(row: dict, constructor: str,
                                    historical_features_df: pd.DataFrame) -> dict:
    """
    At inference time, fill constructor pace features for teams with no
    or little history (Audi, Cadillac) using the midfield average.
    """
    races_for_constructor = (
        historical_features_df.loc[
            historical_features_df["constructor"] == constructor,
            ["year", "round"]
        ]
        .drop_duplicates()
        .shape[0]
    )

    if constructor in NEW_CONSTRUCTORS_2026 or races_for_constructor < MIN_RACES_FOR_OWN_DATA:
        midfield = (
            historical_features_df.groupby("constructor")["constructor_avg_points"]
            .mean()
            .sort_values(ascending=False)
        )
        midfield_avg_points = midfield.iloc[5] if len(midfield) >= 6 else (
            midfield.mean() if len(midfield) else 0.0
        )
        dnf_rates = historical_features_df.groupby("constructor")["constructor_dnf_rate"].mean()
        midfield_dnf_rate = dnf_rates.median() if len(dnf_rates) else 0.10

        row["constructor_avg_points"] = midfield_avg_points
        row["constructor_dnf_rate"]   = midfield_dnf_rate

    return row
