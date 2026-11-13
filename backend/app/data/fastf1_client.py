import fastf1
import pandas as pd
import os

CACHE_DIR = os.getenv("FF1_CACHE_DIR", "data/cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

def get_session(year: int, gp: str, session_type: str = "R"):
    """
    Load a FastF1 session.
    session_type: 'R' = Race, 'Q' = Qualifying, 'FP1/FP2/FP3'
    """
    session = fastf1.get_session(year, gp, session_type)
    session.load()
    return session

def get_lap_times(year: int, gp: str, session_type: str = "R") -> pd.DataFrame:
    """Returns all lap times for a session as a clean DataFrame."""
    session = get_session(year, gp, session_type)
    laps = session.laps[["Driver", "LapNumber", "LapTime", "Compound",
                           "TyreLife", "Stint", "SpeedI1", "SpeedI2",
                           "SpeedFL", "SpeedST", "IsPersonalBest"]].copy()
    laps["LapTimeSeconds"] = laps["LapTime"].dt.total_seconds()
    laps = laps.dropna(subset=["LapTimeSeconds"])
    laps = laps[laps["LapTimeSeconds"] > 60]
    # LapTime is a pandas Timedelta — not JSON-serializable, and
    # LapTimeSeconds above already carries the same information as a
    # plain float, so drop it here rather than leaving every caller
    # (including the API layer) to remember to convert/strip it.
    laps = laps.drop(columns=["LapTime"])
    return laps.reset_index(drop=True)

_RACE_RESULTS_CACHE = {}

def get_race_results(year: int, gp: str) -> pd.DataFrame:
    """Returns final race results with positions and points. Cached in memory for speed."""
    cache_key = (year, str(gp).lower().strip())
    if cache_key in _RACE_RESULTS_CACHE:
        return _RACE_RESULTS_CACHE[cache_key].copy()

    # Try FastF1 with minimal payload first (laps=False, telemetry=False, weather=False)
    try:
        session = fastf1.get_session(year, gp, "R")
        session.load(telemetry=False, weather=False, messages=False, laps=False)
        if session.results is not None and not session.results.empty:
            results = session.results[["DriverNumber", "Abbreviation", "FullName",
                                        "TeamName", "Position", "Points",
                                        "GridPosition", "Status"]].copy()
            results["Year"] = year
            results["GP"] = gp
            df = results.reset_index(drop=True)
            _RACE_RESULTS_CACHE[cache_key] = df
            return df
    except Exception as e:
        print(f"[fastf1_client] FastF1 fast load failed for {year} {gp}: {e}")

    # Fallback to Jolpica if FastF1 fails or session is not cached on FastF1
    try:
        from app.data.ergast_client import _get_jolpica, get_season_schedule
        sched = get_season_schedule(year)
        gp_clean = str(gp).lower().replace("grand prix", "").replace("gp", "").strip()
        match = sched[sched["gp_name"].str.lower().str.contains(gp_clean[:5])]
        if not match.empty:
            rnd = int(match.iloc[0]["round"])
            data = _get_jolpica(f"{year}/{rnd}/results")
            races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
            if races and "Results" in races[0]:
                rows = []
                for r in races[0]["Results"]:
                    rows.append({
                        "DriverNumber": r.get("number", "—"),
                        "Abbreviation": r["Driver"].get("code", r["Driver"]["familyName"][:3].upper()),
                        "FullName": f"{r['Driver']['givenName']} {r['Driver']['familyName']}",
                        "TeamName": r["Constructor"]["name"],
                        "Position": int(r["position"]),
                        "Points": float(r.get("points", 0)),
                        "GridPosition": int(r.get("grid", 0)),
                        "Status": r.get("status", "Finished"),
                        "Year": year,
                        "GP": gp,
                    })
                df = pd.DataFrame(rows)
                if not df.empty:
                    _RACE_RESULTS_CACHE[cache_key] = df
                    return df
    except Exception as e2:
        print(f"[fastf1_client] Jolpica results fallback failed for {year} {gp}: {e2}")

    return pd.DataFrame()


def get_driver_telemetry(year: int, gp: str, driver: str,
                          lap_number: int = None) -> pd.DataFrame:
    """Returns telemetry for a specific driver. Uses fastest lap if no lap number given."""
    session = get_session(year, gp, "R")
    driver_laps = session.laps.pick_driver(driver)
    lap = driver_laps.pick_fastest() if lap_number is None \
          else driver_laps[driver_laps["LapNumber"] == lap_number].iloc[0]
    telemetry = lap.get_telemetry()
    # FastF1's raw telemetry column is named "nGear", not "Gear" — "Gear"
    # only exists after certain FastF1 post-processing helpers are run.
    # Rename here so callers can keep using the friendlier "Gear" name.
    telemetry = telemetry.rename(columns={"nGear": "Gear"})
    return telemetry[["Time", "Speed", "RPM", "Gear", "Throttle",
                       "Brake", "DRS", "Distance"]].copy()

def get_session_drivers(year: int, gp: str, session_type: str = "R") -> list:
    """Returns list of driver abbreviations in a session."""
    session = get_session(year, gp, session_type)
    return list(session.laps["Driver"].unique())
