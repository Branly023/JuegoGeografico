import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Map, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { useGame } from '../../context/GameContext';
import { NormalizeCode } from '../../utils/mapUtils';

const SMALL_COUNTRIES = new Set([
    'VAT', 'SMR', 'MCO', 'AND', 'MLT', 'LIE', 'IMN', 'LUX',
    'FJI', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'SLB', 'TON', 'TUV', 'VUT'
]);

// Region-specific bounds for map clipping [sw, ne] format: [[lng, lat], [lng, lat]]
const REGION_BOUNDS: Record<string, [[number, number], [number, number]]> = {
    'Europe': [[-25, 34], [45, 72]],
    'Asia': [[25, -15], [180, 75]],
    'Africa': [[-25, -40], [55, 40]],
    'Americas': [[-170, -60], [-30, 85]],
    'Oceania': [[100, -50], [180, 5]],
    'World': [[-180, -60], [180, 85]]
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = { type: 'FeatureCollection'; features: any[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Feature = any;

interface GameMapProps {
    onGuess?: (code: string) => void;
    countryStatus?: Record<string, string>;
    overrideTarget?: { cca3: string; name?: { common?: string } } | null;
    isTransitioning?: boolean;
}

// Helper to get feature center from GeoJSON geometry
function getFeatureCenter(feature: Feature): [number, number] {
    const geometry = feature?.geometry;
    if (!geometry || !geometry.type) {
        return [0, 0]; // Return default if geometry is null/undefined
    }
    if (geometry.type === 'Point') {
        return geometry.coordinates as [number, number];
    }
    if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates?.[0];
        if (!coords || coords.length === 0) return [0, 0];
        let sumLng = 0, sumLat = 0;
        coords.forEach(([lng, lat]: [number, number]) => { sumLng += lng; sumLat += lat; });
        return [sumLng / coords.length, sumLat / coords.length];
    }
    if (geometry.type === 'MultiPolygon') {
        let totalPoints = 0, sumLng = 0, sumLat = 0;
        geometry.coordinates.forEach((polygon: number[][][]) => {
            polygon[0].forEach((coord: number[]) => {
                sumLng += coord[0]; sumLat += coord[1]; totalPoints++;
            });
        });
        if (totalPoints === 0) return [0, 0];
        return [sumLng / totalPoints, sumLat / totalPoints];
    }
    return [0, 0];
}

// GeoJSON Layer Component
interface GeoJSONLayerProps {
    data: FeatureCollection;
    countryStatus: Record<string, string>;
    onGuess: (code: string) => void;
    isTransitioning?: boolean;
}

function GeoJSONLayer({ data, countryStatus, onGuess, isTransitioning }: GeoJSONLayerProps) {
    const { map, isLoaded } = useMap();
    const hoveredFeatureRef = useRef<string | null>(null);
    const countryStatusRef = useRef(countryStatus);

    // Keep countryStatus ref updated
    useEffect(() => {
        countryStatusRef.current = countryStatus;
    }, [countryStatus]);

    // Hide text labels from base map (country names would spoil the game!)
    useEffect(() => {
        if (!map || !isLoaded) return;

        // Wait a bit for style to fully load, then hide all symbol/text layers
        const hideLabels = () => {
            const style = map.getStyle();
            if (!style || !style.layers) return;

            style.layers.forEach(layer => {
                // Hide any layer that contains text (symbol layers with text-field)
                if (layer.type === 'symbol') {
                    try {
                        map.setLayoutProperty(layer.id, 'visibility', 'none');
                    } catch (e) {
                        // Layer might not exist, ignore
                    }
                }
            });
        };

        // Run immediately and also on style load
        hideLabels();
        map.on('styledata', hideLabels);

        return () => {
            map.off('styledata', hideLabels);
        };
    }, [map, isLoaded]);

    // Add GeoJSON source and layers
    useEffect(() => {
        if (!map || !isLoaded || !data) return;

        const sourceId = 'countries-source';
        const fillLayerId = 'countries-fill';
        const lineLayerId = 'countries-line';

        // Filter out small countries from GeoJSON (they'll be markers)
        const filteredData: FeatureCollection = {
            type: 'FeatureCollection',
            features: data.features.filter((f: Feature) => !SMALL_COUNTRIES.has(NormalizeCode(f)))
        };

        // Remove existing layers and source if they exist
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        // Add source
        map.addSource(sourceId, {
            type: 'geojson',
            data: filteredData,
            generateId: true
        });

        // Add fill layer
        map.addLayer({
            id: fillLayerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': '#121A33',
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.6,
                    0.5
                ]
            }
        });

        // Add line layer  
        map.addLayer({
            id: lineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    '#ffffff',
                    '#3B82F6'
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    2,
                    0.5
                ]
            }
        });

        // Cleanup
        return () => {
            try {
                if (map && map.getLayer && map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
                if (map && map.getLayer && map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
                if (map && map.getSource && map.getSource(sourceId)) map.removeSource(sourceId);
            } catch (e) {
                // Map may have been destroyed, ignore
            }
        };
    }, [map, isLoaded, data]);

    // Update layer colors when countryStatus changes
    useEffect(() => {
        if (!map || !isLoaded) return;

        const fillLayerId = 'countries-fill';
        const lineLayerId = 'countries-line';

        if (!map.getLayer(fillLayerId)) return;

        // Use coalesce to try multiple property keys
        const codeExpression = ['coalesce',
            ['get', 'ISO_A3'],
            ['get', 'ISO3166-1-Alpha-3'],
            ['get', 'cca3'],
            ['get', 'ADM0_A3'],
            ''
        ];

        // Reverse mapping: normalized code -> raw GeoJSON codes that should also match
        // This handles special cases where GeoJSON uses different codes
        const REVERSE_CODE_MAPPING: Record<string, string[]> = {
            'FRA': ['-99', 'FXX'], // France often has -99 or FXX in GeoJSON
            'NOR': ['-99'],        // Norway territories
            'XKX': ['KOS', '-99'], // Kosovo
            'CYP': ['NCY'],        // Northern Cyprus -> Cyprus
            'SOM': ['SOL'],        // Somaliland -> Somalia
        };

        // Build match expressions for fill and line colors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fillColorExpression: any[] = ['match', codeExpression];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lineColorExpression: any[] = ['match', codeExpression];

        Object.entries(countryStatus).forEach(([code, status]) => {
            let fillColor = '#121A33';
            let lineColor = '#3B82F6';

            if (status === 'correct_1') { fillColor = '#22C55E'; lineColor = '#86EFAC'; }
            else if (status === 'correct_2') { fillColor = '#F59E0B'; lineColor = '#FCD34D'; }
            else if (status === 'correct_3') { fillColor = '#F97316'; lineColor = '#FDBA74'; }
            else if (status === 'failed') { fillColor = '#EF4444'; lineColor = '#FCA5A5'; }

            // Add the normalized code
            fillColorExpression.push(code, fillColor);
            lineColorExpression.push(code, lineColor);

            // Also add any raw GeoJSON codes that map to this normalized code
            const rawCodes = REVERSE_CODE_MAPPING[code];
            if (rawCodes) {
                rawCodes.forEach(rawCode => {
                    fillColorExpression.push(rawCode, fillColor);
                    lineColorExpression.push(rawCode, lineColor);
                });
            }
        });

        // Default values
        fillColorExpression.push('#121A33');
        lineColorExpression.push('#3B82F6');

        try {
            map.setPaintProperty(fillLayerId, 'fill-color', [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#3B82F6', // hover color
                fillColorExpression
            ]);
            map.setPaintProperty(lineLayerId, 'line-color', [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#ffffff', // hover color
                lineColorExpression
            ]);
        } catch (e) {
            console.warn('Failed to update layer colors:', e);
        }
    }, [map, isLoaded, countryStatus]);

    // Mouse interactions
    useEffect(() => {
        if (!map || !isLoaded || isTransitioning) return;

        const sourceId = 'countries-source';
        const fillLayerId = 'countries-fill';

        const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
            if (isTransitioning) return;

            const features = map.queryRenderedFeatures(e.point, { layers: [fillLayerId] });

            // Clear previous hover
            if (hoveredFeatureRef.current !== null) {
                map.setFeatureState(
                    { source: sourceId, id: hoveredFeatureRef.current },
                    { hover: false }
                );
            }

            if (features.length > 0) {
                const feature = features[0];
                const id = feature.id as string;
                hoveredFeatureRef.current = id;
                map.setFeatureState(
                    { source: sourceId, id },
                    { hover: true }
                );
                map.getCanvas().style.cursor = 'pointer';
            } else {
                hoveredFeatureRef.current = null;
                map.getCanvas().style.cursor = '';
            }
        };

        const handleMouseLeave = () => {
            if (hoveredFeatureRef.current !== null) {
                map.setFeatureState(
                    { source: sourceId, id: hoveredFeatureRef.current },
                    { hover: false }
                );
                hoveredFeatureRef.current = null;
            }
            map.getCanvas().style.cursor = '';
        };

        const handleClick = (e: maplibregl.MapMouseEvent) => {
            if (isTransitioning) return;

            const features = map.queryRenderedFeatures(e.point, { layers: [fillLayerId] });
            if (features.length > 0) {
                const feature = features[0];
                const code = NormalizeCode(feature);
                console.log("Clicked Feature:", feature.properties?.ADMIN, "-> Code:", code);
                if (code) {
                    onGuess(code);
                }
            }
        };

        map.on('mousemove', fillLayerId, handleMouseMove);
        map.on('mouseleave', fillLayerId, handleMouseLeave);
        map.on('click', fillLayerId, handleClick);

        return () => {
            map.off('mousemove', fillLayerId, handleMouseMove);
            map.off('mouseleave', fillLayerId, handleMouseLeave);
            map.off('click', fillLayerId, handleClick);
        };
    }, [map, isLoaded, isTransitioning, onGuess]);

    return null;
}

// Small Country Marker Component
interface SmallCountryMarkerProps {
    feature: Feature;
    code: string;
    status?: string;
    onGuess: (code: string) => void;
}

function SmallCountryMarker({ feature, code, status, onGuess }: SmallCountryMarkerProps) {
    const [lng, lat] = getFeatureCenter(feature);

    // Skip rendering if coordinates are invalid (at [0,0])
    if (lng === 0 && lat === 0) {
        console.warn(`SmallCountryMarker: Invalid coordinates for ${code}, skipping render`);
        return null;
    }

    let radius = 6;
    if (code === 'VAT') radius = 8;
    if (code === 'SMR') radius = 7;
    if (code === 'MLT') radius = 7;
    if (code === 'AND') radius = 7;

    let fillColor = '#3B82F6';
    let borderColor = '#ffffff';

    if (status === 'correct_1') { fillColor = '#22C55E'; borderColor = '#86EFAC'; }
    else if (status === 'correct_2') { fillColor = '#F59E0B'; borderColor = '#FCD34D'; }
    else if (status === 'correct_3') { fillColor = '#F97316'; borderColor = '#FDBA74'; }
    else if (status === 'failed') { fillColor = '#EF4444'; borderColor = '#FCA5A5'; }

    return (
        <MapMarker
            longitude={lng}
            latitude={lat}
            onClick={() => {
                console.log("Clicked Small Country:", code);
                onGuess(code);
            }}
        >
            <MarkerContent>
                <div
                    className="rounded-full transition-all duration-300 hover:scale-125"
                    style={{
                        width: radius * 2,
                        height: radius * 2,
                        backgroundColor: fillColor,
                        border: `2px solid ${borderColor}`,
                        cursor: 'pointer'
                    }}
                />
            </MarkerContent>
        </MapMarker>
    );
}

// Map Controller for fly-to animations and region bounds
interface MapControllerProps {
    targetCountry?: { cca3: string } | null;
    geoJson?: FeatureCollection;
    isTransitioning?: boolean;
    region?: string;
}

function MapController({ targetCountry, geoJson, isTransitioning, region = 'World' }: MapControllerProps) {
    const { map, isLoaded } = useMap();
    const initialFitDoneRef = useRef(false);
    const prevRegionRef = useRef(region);
    const wasTransitioningRef = useRef(false);

    // Fit to region bounds only on initial load or when region actually changes
    useEffect(() => {
        if (!map || !isLoaded) return;

        const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['World'];

        // Only fit on initial load or when region changes
        if (!initialFitDoneRef.current || prevRegionRef.current !== region) {
            map.fitBounds(bounds, {
                padding: 20,
                duration: initialFitDoneRef.current ? 1000 : 0
            });
            initialFitDoneRef.current = true;
            prevRegionRef.current = region;
        }
    }, [map, isLoaded, region]);

    // Handle country zoom during transitions (failed guess reveal)
    useEffect(() => {
        if (!map || !isLoaded || !geoJson) return;

        if (isTransitioning && targetCountry) {
            // Zoom to failed country
            const feature = geoJson.features.find(f => NormalizeCode(f) === targetCountry.cca3);
            if (feature) {
                const [lng, lat] = getFeatureCenter(feature);
                map.flyTo({
                    center: [lng, lat],
                    zoom: 5,
                    duration: 1500,
                    essential: true
                });
            }
            wasTransitioningRef.current = true;
        } else if (!isTransitioning && wasTransitioningRef.current) {
            // Only return to region bounds after a transition ends
            wasTransitioningRef.current = false;
            const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['World'];
            map.fitBounds(bounds, {
                padding: 20,
                duration: 1000
            });
        }
    }, [map, isLoaded, isTransitioning, targetCountry, geoJson, region]);

    return null;
}

const GameMap = ({ onGuess, countryStatus: propsStatus, overrideTarget, isTransitioning: propsTransitioning }: GameMapProps = {}) => {
    const { geoJson, makeGuess, countryStatus: ctxStatus, filteredCountries, region, isTransitioning: ctxTransitioning, targetCountry: ctxTarget, gameType, gameKey } = useGame();

    const countryStatus = propsStatus || ctxStatus;
    const targetCountry = overrideTarget || ctxTarget;
    const isTransitioning = propsTransitioning !== undefined ? propsTransitioning : ctxTransitioning;

    // Handler for guesses
    const handleGuess = useCallback((code: string) => {
        if (onGuess) {
            onGuess(code);
        } else {
            makeGuess(code);
        }
    }, [onGuess, makeGuess]);

    // Filter GeoJSON based on active countries
    const filteredData = useMemo((): FeatureCollection | null => {
        if (!geoJson || !filteredCountries?.length) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validCodes = new Set(filteredCountries.map((c: any) => c.cca3));

        if (region === 'Europe' || region === 'World') {
            validCodes.add('XKX');
            validCodes.add('KOS');
        }

        const features = geoJson.features.filter((f: Feature) => {
            const code = NormalizeCode(f);
            return validCodes.has(code);
        });

        return { type: 'FeatureCollection', features };
    }, [geoJson, filteredCountries, region]);

    // Get small countries for markers (deduplicated by code)
    const smallCountryFeatures = useMemo(() => {
        if (!filteredData) return [];
        const seen = new Set<string>();
        return filteredData.features.filter((f: Feature) => {
            const code = NormalizeCode(f);
            if (!SMALL_COUNTRIES.has(code)) return false;
            if (seen.has(code)) return false; // Skip duplicates
            seen.add(code);
            return true;
        });
    }, [filteredData]);

    if (!filteredData) {
        return (
            <div className="w-full h-full flex items-center justify-center text-soft-gray animate-pulse font-mono">
                Initializing Sat-Link...
            </div>
        );
    }

    return (
        <div
            className="w-full h-full rounded-2xl overflow-hidden border border-brand-europe/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative bg-night"
            key={`${region}-${gameType}-${gameKey}`}
        >
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

            <Map
                center={[0, 20]}
                zoom={2.5}
                minZoom={2}
                theme="dark"
            >
                {/* GeoJSON Layer */}
                <GeoJSONLayer
                    data={filteredData}
                    countryStatus={countryStatus}
                    onGuess={handleGuess}
                    isTransitioning={isTransitioning}
                />

                {/* Small Country Markers */}
                {smallCountryFeatures.map((feature: Feature) => {
                    const code = NormalizeCode(feature);
                    return (
                        <SmallCountryMarker
                            key={code}
                            feature={feature}
                            code={code}
                            status={countryStatus[code]}
                            onGuess={handleGuess}
                        />
                    );
                })}

                {/* Map Controller for animations */}
                <MapController
                    targetCountry={targetCountry}
                    geoJson={geoJson}
                    isTransitioning={isTransitioning}
                    region={region}
                />
            </Map>
        </div>
    );
};

export default React.memo(GameMap);
