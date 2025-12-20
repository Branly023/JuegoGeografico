import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { type Country, fetchCountries, fetchGeoJSON } from '../services/api';
import { audioService } from '../services/audio';
import { NormalizeCode } from '../utils/mapUtils';

export type GameType = 'flag' | 'name';
export type Region = 'World' | 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania';
export type Language = 'en' | 'es';

interface GameState {
    lives: number;
    score: number;
    targetCountry: Country | null;
    gameState: 'loading' | 'playing' | 'won' | 'lost';
    countryStatus: Record<string, 'correct_1' | 'correct_2' | 'correct_3' | 'failed'>;
}

interface GameContextProps extends GameState {
    makeGuess: (countryCode: string) => void;
    restartGame: () => void;
    startGame: (config?: { mode: GameType, region: Region }) => void;
    exitGame: () => void;
    gameType: GameType;
    region: Region;
    language: Language;
    setLanguage: (lang: Language) => void;
    filteredCountries: Country[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geoJson: any;
    isTransitioning: boolean;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [geoJson, setGeoJson] = useState<any>(null);

    const [targetCountry, setTargetCountry] = useState<Country | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'won' | 'lost'>('loading');
    const [countryStatus, setCountryStatus] = useState<Record<string, 'correct_1' | 'correct_2' | 'correct_3' | 'failed'>>({});
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Game Modes
    const [gameType, setGameType] = useState<GameType>('flag');
    const [region, setRegion] = useState<Region>('World');
    const [language, setLanguage] = useState<Language>('es');

    const [usedCountries, setUsedCountries] = useState<Set<string>>(new Set());

    useEffect(() => {
        const init = async () => {
            try {
                const [countriesData, geoData] = await Promise.all([fetchCountries(), fetchGeoJSON()]);
                setCountries(countriesData);
                setCountries(countriesData);


                // Inject Microstates (Point Features) into GeoJSON
                const MICROSTATES = ['VAT', 'SMR', 'MCO', 'GIB', 'JEY', 'GGY', 'LIE', 'AND', 'MLT'];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const injectedFeatures = [...geoData.features];

                MICROSTATES.forEach(code => {
                    const country = countriesData.find(c => c.cca3 === code);
                    // Only inject if it exists in data but MIGHT be missing or null-geometry in map
                    // We check if it's already a VALID polygon feature to avoid duplicates, 
                    // but for this simplified map, we know they are missing/null.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const exists = injectedFeatures.some((f: any) => NormalizeCode(f) === code && f.geometry);

                    if (!exists && country && country.latlng) {
                        // Create Synthetic Point Feature
                        injectedFeatures.push({
                            type: 'Feature',
                            properties: {
                                name: country.name.common,
                                cca3: code,
                                'ISO3166-1-Alpha-3': code
                            },
                            geometry: {
                                type: 'Point',
                                coordinates: [country.latlng[1], country.latlng[0]] // GeoJSON is [Lon, Lat]
                            },
                            id: code
                        });
                        console.log(`Injecting Microstate: ${code} at ${country.latlng}`);
                    }
                });

                const finalGeoJson = { ...geoData, features: injectedFeatures };
                setGeoJson(finalGeoJson);

                // Pre-set filtered countries based on this NEW map
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const validCodes = new Set(injectedFeatures.map((f: any) => NormalizeCode(f)));
                const validCountries = countriesData.filter(c => validCodes.has(c.cca3));

                setFilteredCountries(validCountries);
                setGameState('loading');
            } catch (error) {
                console.error("Failed to load game data", error);
            }
        };
        init();
    }, []);

    const startGame = (config: { mode: GameType, region: Region } = { mode: 'flag', region: 'World' }) => {
        setGameType(config.mode);
        setRegion(config.region);

        // Filter countries
        let activeList = countries;
        if (config.region !== 'World') {
            activeList = countries.filter(c => c.region === config.region);

            // Special filter for Americas: 
            // 1. Caribbean: Only Major Islands (Cuba, Haiti, DR, Jamaica, PR, Bahamas)
            // 2. Mainland: Only UN Members (Removes French Guiana, Falklands, Bermuda, etc)
            if (config.region === 'Americas') {
                const CARIBBEAN_ALLOW = ['CUB', 'HTI', 'DOM', 'JAM', 'PRI', 'BHS'];
                activeList = activeList.filter(c => {
                    if (c.subregion === 'Caribbean') {
                        return CARIBBEAN_ALLOW.includes(c.cca3);
                    }
                    return c.unMember;
                });
            }
        }

        // Final Filter: Must exist on Map (using CURRENT geoJson which has injected points)
        if (geoJson) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validCodes = new Set(geoJson.features.map((f: any) => NormalizeCode(f)));
            activeList = activeList.filter(c => validCodes.has(c.cca3));
        }

        setFilteredCountries(activeList);

        setScore(0);
        setAttempts(0);
        setCountryStatus({});
        setGameState('playing');
        setUsedCountries(new Set());
        setIsTransitioning(false);
        pickNewTarget(activeList, new Set());
    };

    const pickNewTarget = (list: Country[], used: Set<string>) => {
        const validCountries = list.filter(c => c.cca3 && !used.has(c.cca3));
        if (validCountries.length === 0) {
            setGameState('won');
            audioService.playWin();
            return;
        }
        const randomIndex = Math.floor(Math.random() * validCountries.length);
        setTargetCountry(validCountries[randomIndex]);
        setAttempts(0);
    };

    // State Ref Pattern to handle stale closures in Leaflet event listeners
    const stateRef = useRef({ attempts, targetCountry, gameState, isTransitioning, usedCountries, filteredCountries, gameType, region, language, countryStatus });

    useEffect(() => {
        stateRef.current = { attempts, targetCountry, gameState, isTransitioning, usedCountries, filteredCountries, gameType, region, language, countryStatus };
    }, [attempts, targetCountry, gameState, isTransitioning, usedCountries, filteredCountries, gameType, region, language, countryStatus]);

    const restartGame = () => {
        const current = stateRef.current;
        startGame({ mode: current.gameType, region: current.region });
    };

    const exitGame = () => {
        setScore(0);
        setAttempts(0);
        setCountryStatus({});
        setTargetCountry(null);
        setUsedCountries(new Set());
        setGameState('loading');
        setIsTransitioning(false);
    };

    const makeGuess = (countryCode: string) => {
        // Read fresh state from ref
        const current = stateRef.current;

        if (current.gameState !== 'playing' || !current.targetCountry || current.isTransitioning) return;

        // Prevent interacting with already solved countries
        if (current.countryStatus[countryCode] && current.countryStatus[countryCode].startsWith('correct')) {
            console.log("Already solved:", countryCode);
            return;
        }

        console.log(`Guessing: ${countryCode} vs Target: ${current.targetCountry.cca3}`);

        if (countryCode === current.targetCountry.cca3) {
            // Correct Guess
            audioService.playSuccess();
            let status: 'correct_1' | 'correct_2' | 'correct_3' = 'correct_1';

            if (current.attempts === 1) status = 'correct_2';
            if (current.attempts === 2) status = 'correct_3';

            setScore(prev => prev + 1);

            setCountryStatus(prev => ({
                ...prev,
                [current.targetCountry!.cca3]: status
            }));

            // Logic for success
            const newSet = new Set(current.usedCountries);
            newSet.add(current.targetCountry.cca3);
            setUsedCountries(newSet);
            // Use filteredCountries from ref
            pickNewTarget(current.filteredCountries, newSet);

        } else {
            // Incorrect Guess
            const nextAttempts = current.attempts + 1;

            if (nextAttempts < 3) {
                // Warning only
                setAttempts(nextAttempts);
                audioService.playWarning();
            } else {
                // Failed 3 times (Game Over for this country)
                audioService.playFailure();

                setCountryStatus(prevStatus => ({
                    ...prevStatus,
                    [current.targetCountry!.cca3]: 'failed'
                }));

                setIsTransitioning(true);

                // Delay to show the correct country (Red) and animate
                setTimeout(() => {
                    const newSet = new Set(current.usedCountries);
                    if (current.targetCountry) newSet.add(current.targetCountry.cca3);

                    setUsedCountries(newSet);
                    pickNewTarget(current.filteredCountries, newSet);
                    setIsTransitioning(false);
                    console.log("Transition unlocked");
                }, 2500);

                setAttempts(0);
            }
        }
    };

    return (
        <GameContext.Provider value={{ lives: 3 - attempts, score, targetCountry, gameState, makeGuess, restartGame, exitGame, countryStatus, startGame, gameType, region, language, setLanguage, filteredCountries, geoJson, isTransitioning }}>
            {children}
        </GameContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
