
// Maps territory codes to their sovereign country code (Game Target)
export const SOVEREIGN_MAPPING: Record<string, string> = {
    // France and territories
    'GUF': 'FRA', 'GLP': 'FRA', 'MTQ': 'FRA', 'REU': 'FRA', 'MYT': 'FRA',
    'SPM': 'FRA', 'WLF': 'FRA', 'PYF': 'FRA', 'NCL': 'FRA', 'MAF': 'FRA', 'BLM': 'FRA',
    '-99': 'FRA', // Often France in some GeoJSONs

    // Norway
    'SJM': 'NOR', 'BVT': 'NOR',

    // Kosovo
    'KOS': 'XKX', 'XKX': 'XKX',

    // Cyprus
    'NCY': 'CYP', // Northern Cyprus -> Cyprus

    // Somaliland
    'SOL': 'SOM',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NormalizeCode = (feature: any): string => {
    const p = feature.properties;
    const code = p['ISO3166-1-Alpha-3'] || p.ISO_A3 || p.iso_a3 || p.ISO3 || p.cca3 || p.ADM0_A3 || p.adm0_a3 || p.GU_A3 || p.SU_A3 || feature.id;
    const name = p.ADMIN || p.name || p.NAME || '';

    // Specialized Name Checks
    if (name === 'France') return 'FRA';
    if (name === 'Norway') return 'NOR';
    if (name === 'Kosovo') return 'XKX';

    // Check Mapping
    if (code && SOVEREIGN_MAPPING[code]) {
        return SOVEREIGN_MAPPING[code];
    }

    // Handle -99 codes for sovereign territories if code is generic
    if (code === '-99') {
        if (name === 'France') return 'FRA';
        if (name === 'Norway') return 'NOR';
        if (name === 'Northern Cyprus') return 'CYP';
        if (name === 'Somaliland') return 'SOM';
        if (name === 'Kosovo') return 'XKX';
    }

    return code;
};
