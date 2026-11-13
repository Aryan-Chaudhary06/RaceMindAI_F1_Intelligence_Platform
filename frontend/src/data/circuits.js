// Maps circuit names (as returned by our schedule API / Ergast-Jolpica
// "circuitName" field, GP titles, locations, and raw layout IDs) to layout IDs
// in the local public/circuits/ folder.
//
// Keys are normalized (lowercased, punctuation stripped) so lookups are
// resilient to minor naming differences between data sources.

// Set of verified layout IDs present as SVGs in public/circuits/
export const VALID_LAYOUT_IDS = new Set([
  "austin-1",
  "bahrain-1",
  "baku-1",
  "catalunya-6",
  "hungaroring-3",
  "interlagos-2",
  "jeddah-1",
  "las-vegas-1",
  "lusail-1",
  "marina-bay-4",
  "melbourne-2",
  "mexico-city-3",
  "miami-1",
  "monaco-5",
  "montreal-6",
  "monza-6",
  "sepang-1",
  "shanghai-1",
  "silverstone-8",
  "spa-francorchamps-4",
  "spielberg-3",
  "suzuka-2",
  "yas-marina-2",
  "zandvoort-5",
]);

// Base path for circuit SVGs served statically from public/circuits/
const rawBase = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
const basePrefix = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
export const CIRCUIT_SVG_BASE = `${basePrefix}/circuits`;

// Comprehensive mapping: Circuit names, GP names, cities, countries, and aliases -> layoutId
const RAW_MAP = {
  // Austin / COTA (Circuit of the Americas)
  "Circuit of the Americas": "austin-1",
  "COTA": "austin-1",
  "United States Grand Prix": "austin-1",
  "United States GP": "austin-1",
  "USA Grand Prix": "austin-1",
  "US Grand Prix": "austin-1",
  "Austin Grand Prix": "austin-1",
  "Austin": "austin-1",
  "Americas": "austin-1",
  "austin-1": "austin-1",

  // Bahrain / Sakhir
  "Bahrain International Circuit": "bahrain-1",
  "Bahrain Grand Prix": "bahrain-1",
  "Bahrain GP": "bahrain-1",
  "Sakhir Grand Prix": "bahrain-1",
  "Bahrain": "bahrain-1",
  "Sakhir": "bahrain-1",
  "bahrain-1": "bahrain-1",

  // Baku / Azerbaijan
  "Baku City Circuit": "baku-1",
  "Azerbaijan Grand Prix": "baku-1",
  "Azerbaijan GP": "baku-1",
  "Baku Grand Prix": "baku-1",
  "European Grand Prix": "baku-1",
  "Azerbaijan": "baku-1",
  "Baku": "baku-1",
  "baku-1": "baku-1",

  // Barcelona / Catalunya
  "Circuit de Barcelona-Catalunya": "catalunya-6",
  "Circuit de Barcelona Catalunya": "catalunya-6",
  "Circuit de Catalunya": "catalunya-6",
  "Spanish Grand Prix": "catalunya-6",
  "Spanish GP": "catalunya-6",
  "Spain Grand Prix": "catalunya-6",
  "Barcelona Grand Prix": "catalunya-6",
  "Catalunya Grand Prix": "catalunya-6",
  "Barcelona": "catalunya-6",
  "Catalunya": "catalunya-6",
  "Montmelo": "catalunya-6",
  "Spain": "catalunya-6",
  "catalunya-6": "catalunya-6",

  // Hungaroring / Budapest
  "Hungaroring": "hungaroring-3",
  "Hungarian Grand Prix": "hungaroring-3",
  "Hungarian GP": "hungaroring-3",
  "Hungary Grand Prix": "hungaroring-3",
  "Budapest Grand Prix": "hungaroring-3",
  "Hungary": "hungaroring-3",
  "Budapest": "hungaroring-3",
  "Mogyorod": "hungaroring-3",
  "hungaroring-3": "hungaroring-3",

  // Interlagos / São Paulo
  "Autódromo José Carlos Pace": "interlagos-2",
  "Autodromo Jose Carlos Pace": "interlagos-2",
  "Jose Carlos Pace": "interlagos-2",
  "Interlagos Circuit": "interlagos-2",
  "Interlagos": "interlagos-2",
  "São Paulo Grand Prix": "interlagos-2",
  "Sao Paulo Grand Prix": "interlagos-2",
  "Sao Paulo GP": "interlagos-2",
  "Brazilian Grand Prix": "interlagos-2",
  "Brazilian GP": "interlagos-2",
  "Brazil Grand Prix": "interlagos-2",
  "São Paulo": "interlagos-2",
  "Sao Paulo": "interlagos-2",
  "Brazil": "interlagos-2",
  "interlagos-2": "interlagos-2",

  // Jeddah / Saudi Arabia
  "Jeddah Corniche Circuit": "jeddah-1",
  "Jeddah Street Circuit": "jeddah-1",
  "Saudi Arabian Grand Prix": "jeddah-1",
  "Saudi Arabian GP": "jeddah-1",
  "Saudi Arabia Grand Prix": "jeddah-1",
  "Jeddah Grand Prix": "jeddah-1",
  "Saudi Arabia": "jeddah-1",
  "Jeddah": "jeddah-1",
  "jeddah-1": "jeddah-1",

  // Las Vegas
  "Las Vegas Strip Street Circuit": "las-vegas-1",
  "Las Vegas Strip Circuit": "las-vegas-1",
  "Las Vegas Street Circuit": "las-vegas-1",
  "Las Vegas Grand Prix": "las-vegas-1",
  "Las Vegas GP": "las-vegas-1",
  "Vegas Grand Prix": "las-vegas-1",
  "Las Vegas": "las-vegas-1",
  "Vegas": "las-vegas-1",
  "las-vegas-1": "las-vegas-1",
  "las_vegas": "las-vegas-1",

  // Lusail / Qatar
  "Lusail International Circuit": "lusail-1",
  "Losail International Circuit": "lusail-1",
  "Lusail Circuit": "lusail-1",
  "Losail Circuit": "lusail-1",
  "Qatar Grand Prix": "lusail-1",
  "Qatar GP": "lusail-1",
  "Lusail Grand Prix": "lusail-1",
  "Qatar": "lusail-1",
  "Lusail": "lusail-1",
  "Losail": "lusail-1",
  "Doha": "lusail-1",
  "lusail-1": "lusail-1",

  // Marina Bay / Singapore
  "Marina Bay Street Circuit": "marina-bay-4",
  "Marina Bay Circuit": "marina-bay-4",
  "Singapore Grand Prix": "marina-bay-4",
  "Singapore GP": "marina-bay-4",
  "Marina Bay": "marina-bay-4",
  "Singapore": "marina-bay-4",
  "marina-bay-4": "marina-bay-4",
  "marina_bay": "marina-bay-4",

  // Melbourne / Albert Park
  "Albert Park Grand Prix Circuit": "melbourne-2",
  "Albert Park Circuit": "melbourne-2",
  "Melbourne Grand Prix Circuit": "melbourne-2",
  "Albert Park": "melbourne-2",
  "Australian Grand Prix": "melbourne-2",
  "Australian GP": "melbourne-2",
  "Australia Grand Prix": "melbourne-2",
  "Melbourne Grand Prix": "melbourne-2",
  "Melbourne": "melbourne-2",
  "Australia": "melbourne-2",
  "albert_park": "melbourne-2",
  "melbourne-2": "melbourne-2",

  // Mexico City / Hermanos Rodríguez
  "Autódromo Hermanos Rodríguez": "mexico-city-3",
  "Autodromo Hermanos Rodriguez": "mexico-city-3",
  "Hermanos Rodriguez": "mexico-city-3",
  "Mexico City Grand Prix": "mexico-city-3",
  "Mexico City GP": "mexico-city-3",
  "Mexican Grand Prix": "mexico-city-3",
  "Mexican GP": "mexico-city-3",
  "Mexico Grand Prix": "mexico-city-3",
  "Mexico City": "mexico-city-3",
  "Mexico": "mexico-city-3",
  "mexico-city-3": "mexico-city-3",
  "mexico_city": "mexico-city-3",

  // Miami
  "Miami International Autodrome": "miami-1",
  "Miami Grand Prix": "miami-1",
  "Miami GP": "miami-1",
  "Miami": "miami-1",
  "Hard Rock Stadium": "miami-1",
  "miami-1": "miami-1",

  // Monaco / Monte Carlo
  "Circuit de Monaco": "monaco-5",
  "Monaco Grand Prix": "monaco-5",
  "Monaco GP": "monaco-5",
  "Monte Carlo Grand Prix": "monaco-5",
  "Monte Carlo": "monaco-5",
  "Monaco": "monaco-5",
  "monaco-5": "monaco-5",

  // Montreal / Circuit Gilles Villeneuve
  "Circuit Gilles Villeneuve": "montreal-6",
  "Circuit Gilles-Villeneuve": "montreal-6",
  "Gilles Villeneuve": "montreal-6",
  "Canadian Grand Prix": "montreal-6",
  "Canadian GP": "montreal-6",
  "Canada Grand Prix": "montreal-6",
  "Montreal Grand Prix": "montreal-6",
  "Montreal": "montreal-6",
  "Canada": "montreal-6",
  "montreal-6": "montreal-6",
  "villeneuve": "montreal-6",

  // Monza
  "Autodromo Nazionale Monza": "monza-6",
  "Autodromo Nazionale di Monza": "monza-6",
  "Monza Circuit": "monza-6",
  "Italian Grand Prix": "monza-6",
  "Italian GP": "monza-6",
  "Italy Grand Prix": "monza-6",
  "Monza Grand Prix": "monza-6",
  "Monza": "monza-6",
  "Italy": "monza-6",
  "monza-6": "monza-6",

  // Sepang
  "Sepang International Circuit": "sepang-1",
  "Sepang Circuit": "sepang-1",
  "Malaysian Grand Prix": "sepang-1",
  "Malaysian GP": "sepang-1",
  "Malaysia Grand Prix": "sepang-1",
  "Sepang": "sepang-1",
  "Malaysia": "sepang-1",
  "sepang-1": "sepang-1",

  // Shanghai
  "Shanghai International Circuit": "shanghai-1",
  "Chinese Grand Prix": "shanghai-1",
  "Chinese GP": "shanghai-1",
  "China Grand Prix": "shanghai-1",
  "Shanghai Grand Prix": "shanghai-1",
  "Shanghai": "shanghai-1",
  "China": "shanghai-1",
  "shanghai-1": "shanghai-1",

  // Silverstone
  "Silverstone Circuit": "silverstone-8",
  "British Grand Prix": "silverstone-8",
  "British GP": "silverstone-8",
  "Great Britain Grand Prix": "silverstone-8",
  "70th Anniversary Grand Prix": "silverstone-8",
  "Silverstone Grand Prix": "silverstone-8",
  "Silverstone": "silverstone-8",
  "Great Britain": "silverstone-8",
  "United Kingdom": "silverstone-8",
  "UK": "silverstone-8",
  "silverstone-8": "silverstone-8",

  // Spa-Francorchamps
  "Circuit de Spa-Francorchamps": "spa-francorchamps-4",
  "Circuit de Spa Francorchamps": "spa-francorchamps-4",
  "Spa-Francorchamps": "spa-francorchamps-4",
  "Spa Francorchamps": "spa-francorchamps-4",
  "Belgian Grand Prix": "spa-francorchamps-4",
  "Belgian GP": "spa-francorchamps-4",
  "Belgium Grand Prix": "spa-francorchamps-4",
  "Spa Grand Prix": "spa-francorchamps-4",
  "Spa": "spa-francorchamps-4",
  "Francorchamps": "spa-francorchamps-4",
  "Belgium": "spa-francorchamps-4",
  "spa-francorchamps-4": "spa-francorchamps-4",

  // Spielberg / Red Bull Ring
  "Red Bull Ring": "spielberg-3",
  "A1-Ring": "spielberg-3",
  "A1 Ring": "spielberg-3",
  "Osterreichring": "spielberg-3",
  "Österreichring": "spielberg-3",
  "Austrian Grand Prix": "spielberg-3",
  "Austrian GP": "spielberg-3",
  "Austria Grand Prix": "spielberg-3",
  "Styrian Grand Prix": "spielberg-3",
  "Styrian GP": "spielberg-3",
  "Spielberg Grand Prix": "spielberg-3",
  "Spielberg": "spielberg-3",
  "Austria": "spielberg-3",
  "Styria": "spielberg-3",
  "spielberg-3": "spielberg-3",
  "red_bull_ring": "spielberg-3",

  // Suzuka
  "Suzuka Circuit": "suzuka-2",
  "Suzuka International Racing Course": "suzuka-2",
  "Japanese Grand Prix": "suzuka-2",
  "Japanese GP": "suzuka-2",
  "Japan Grand Prix": "suzuka-2",
  "Suzuka Grand Prix": "suzuka-2",
  "Suzuka": "suzuka-2",
  "Japan": "suzuka-2",
  "suzuka-2": "suzuka-2",

  // Yas Marina / Abu Dhabi
  "Yas Marina Circuit": "yas-marina-2",
  "Abu Dhabi Grand Prix": "yas-marina-2",
  "Abu Dhabi GP": "yas-marina-2",
  "United Arab Emirates Grand Prix": "yas-marina-2",
  "Yas Marina": "yas-marina-2",
  "Abu Dhabi": "yas-marina-2",
  "United Arab Emirates": "yas-marina-2",
  "UAE": "yas-marina-2",
  "yas-marina-2": "yas-marina-2",
  "yas_marina": "yas-marina-2",

  // Zandvoort
  "Circuit Zandvoort": "zandvoort-5",
  "Circuit Park Zandvoort": "zandvoort-5",
  "Dutch Grand Prix": "zandvoort-5",
  "Dutch GP": "zandvoort-5",
  "Netherlands Grand Prix": "zandvoort-5",
  "Zandvoort Grand Prix": "zandvoort-5",
  "Zandvoort": "zandvoort-5",
  "Netherlands": "zandvoort-5",
  "Holland": "zandvoort-5",
  "zandvoort-5": "zandvoort-5"
};

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const NORMALIZED_MAP = Object.fromEntries(
  Object.entries(RAW_MAP).map(([name, layoutId]) => [normalize(name), layoutId])
);

// Sorted by descending length so more specific multi-word keys match before shorter substrings
const SORTED_KEYS = Object.keys(NORMALIZED_MAP).sort((a, b) => b.length - a.length);

/**
 * Resolve a circuit name, GP name, city, or layout ID to its layoutId in public/circuits,
 * or null if unknown / unavailable.
 */
export function getLayoutId(circuitName) {
  if (!circuitName) return null;
  const raw = typeof circuitName === "string"
    ? circuitName
    : (circuitName.circuitName || circuitName.circuit || circuitName.name || circuitName.id || "");

  if (!raw || typeof raw !== "string") return null;

  // 1. Direct layout ID check (e.g. "bahrain-1", "catalunya-6.svg", "/circuits/monza-6.svg")
  const cleanId = raw.trim().replace(/^.*[\\/]/, "").replace(/\.svg$/i, "").toLowerCase();
  if (VALID_LAYOUT_IDS.has(cleanId)) {
    return cleanId;
  }

  // 2. Exact match on normalized string
  const key = normalize(raw);
  if (!key) return null;
  if (NORMALIZED_MAP[key]) return NORMALIZED_MAP[key];

  // 3. Compact space-free match (e.g. "redbullring", "albertpark", "lasvegas")
  const keyNoSpaces = key.replace(/\s+/g, "");
  for (const [k, layoutId] of Object.entries(NORMALIZED_MAP)) {
    if (k.replace(/\s+/g, "") === keyNoSpaces) {
      return layoutId;
    }
  }

  // 4. Substring / Token matching: prefer longer key matches first
  for (const k of SORTED_KEYS) {
    if (k.length >= 3 && (key.includes(k) || (key.length >= 4 && k.includes(key)))) {
      return NORMALIZED_MAP[k];
    }
  }

  return null;
}

/**
 * Full SVG URL for a given circuit name/ID resolving into /circuits/{layoutId}.svg,
 * or null if no layout is known.
 */
export function getCircuitSvgUrl(circuitName) {
  const layoutId = getLayoutId(circuitName);
  return layoutId ? `${CIRCUIT_SVG_BASE}/${layoutId}.svg` : null;
}
