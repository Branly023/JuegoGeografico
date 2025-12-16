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
}

export const fetchCountries = async (): Promise<Country[]> => {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca3,region,subregion,translations,unMember');
    if (!response.ok) {
        throw new Error('Failed to fetch countries');
    }
    return response.json();
};

export const fetchGeoJSON = async () => {
    const response = await fetch('/world_simplified.geojson');
    if (!response.ok) {
        throw new Error('Failed to fetch GeoJSON');
    }
    return response.json();
};
