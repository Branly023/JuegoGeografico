export interface Country {
    name: {
        common: string;
        official: string;
    };
    flags: {
        png: string;
        svg: string;
        alt?: string;
    };
    cca3: string;
    region: string;
    subregion: string;
    translations: Record<string, { common: string; official: string }>;
    unMember: boolean;
    latlng: [number, number];
    area: number;
}

export const fetchCountries = async (): Promise<Country[]> => {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca3,region,subregion,translations,unMember,latlng,area');
    if (!response.ok) {
        throw new Error('Failed to fetch countries');
    }
    const data = await response.json();
    return data.map((country: Country) => {
        // Fix Kosovo code (some APIs return 'XK' or 'UNK')
        if (country.name.common === 'Kosovo') {
            return { ...country, cca3: 'XKX' };
        }
        return country;
    });
};

export const fetchGeoJSON = async () => {
    const response = await fetch('/world_simplified.geojson');
    if (!response.ok) {
        throw new Error('Failed to fetch GeoJSON');
    }
    return response.json();
};
