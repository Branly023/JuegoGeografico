
import React from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGame } from '../../context/GameContext';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';

// Maps territory codes to their sovereign country code (Game Target)
import { NormalizeCode } from '../../utils/mapUtils';

// Component to handle map bounds updates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapController = ({ bounds }: { bounds: any }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, easeLinearity: 0.5 });
        } else {
            // Reset to default view (World)
            map.flyTo([20, 0], 2.5, { duration: 1.5, easeLinearity: 0.5 });
        }
    }, [bounds, map]);
    return null;
};

interface GameMapProps {
    onGuess?: (code: string) => void;
    countryStatus?: Record<string, string>;
    overrideTarget?: any;
    isTransitioning?: boolean;
}

const GameMap = ({ onGuess, countryStatus: propsStatus, overrideTarget, isTransitioning: propsTransitioning }: GameMapProps = {}) => {
    const { geoJson, makeGuess, countryStatus: ctxStatus, filteredCountries, region, isTransitioning: ctxTransitioning, targetCountry: ctxTarget, gameType } = useGame();

    // Merge logic: Props take precedence
    const countryStatus = propsStatus || ctxStatus;
    const targetCountry = overrideTarget || ctxTarget;
    const isTransitioning = propsTransitioning !== undefined ? propsTransitioning : ctxTransitioning;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bounds, setBounds] = useState<any>(null);
    const geoJsonRef = useRef<L.GeoJSON>(null);
    // Ref for countryStatus to avoid closure staleness in event handlers
    const countryStatusRef = useRef(countryStatus);

    // Update ref when countryStatus changes
    useEffect(() => {
        countryStatusRef.current = countryStatus;
    }, [countryStatus]);

    // Filter GeoJSON based on active countries (Region Filter)
    const filteredData = useMemo(() => {
        if (!geoJson || !filteredCountries || !filteredCountries.length) return null;

        const validCodes = new Set(filteredCountries.map(c => c.cca3));
        validCodes.add('XKX'); // Force enable Kosovo
        validCodes.add('KOS');

        // Filter features
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features = geoJson.features.filter((f: any) => {
            const code = NormalizeCode(f);
            return validCodes.has(code);
        });

        return { type: 'FeatureCollection', features };
    }, [geoJson, filteredCountries]);

    // Effect: Fly to target on Defeat (Transitioning)
    useEffect(() => {
        if (isTransitioning && targetCountry && geoJson) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const feature = geoJson.features.find((f: any) => NormalizeCode(f) === targetCountry.cca3);
            if (feature) {
                const layer = L.geoJSON(feature);
                const b = layer.getBounds();
                if (b.isValid()) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setBounds(b);
                }
            }
        } else {
            // Reset bounds when not transitioning
            setBounds(null);
        }
    }, [isTransitioning, targetCountry, geoJson]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getStyle = useCallback((feature: any) => {
        const code = NormalizeCode(feature);
        // Access latest status from ref
        const status = countryStatusRef.current[code];

        // Base Style (Unselected)
        let fillColor = '#121A33'; // Deep Blue (deep)
        let fillOpacity = 0.5;
        let color = '#3B82F6'; // Brand Europe (as default border)
        let weight = 0.5;
        const dashArray = '1';

        // Dynamic Status Styles
        if (status === 'correct_1') {
            fillColor = '#22C55E'; // Success Green
            fillOpacity = 0.9;
            color = '#86EFAC';
            weight = 2;
        }
        else if (status === 'correct_2') {
            fillColor = '#F59E0B'; // Africa Orange (Warning/Gold)
            fillOpacity = 0.9;
            color = '#FCD34D';
            weight = 2;
        }
        else if (status === 'correct_3') {
            fillColor = '#F97316'; // Warning Orange
            fillOpacity = 0.9;
            color = '#FDBA74';
            weight = 2;
        }
        else if (status === 'failed') {
            fillColor = '#EF4444'; // Error Red
            fillOpacity = 0.9;
            color = '#FCA5A5';
            weight = 2;
        }

        return {
            fillColor,
            fillOpacity,
            weight,
            opacity: 0.8,
            color,
            dashArray,
            className: 'transition-all duration-300' // Smooth transitions
        };
    }, []); // No dependencies needed as it reads from ref

    // Effect to update styles of existing layers when status changes
    useEffect(() => {
        if (geoJsonRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            geoJsonRef.current.eachLayer((layer: any) => {
                if (layer.feature) {
                    const style = getStyle(layer.feature);
                    layer.setStyle(style);
                }
            });
        }
    }, [countryStatus, getStyle]); // Depend on countryStatus references update

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onEachFeature = useCallback((feature: any, layer: any) => {
        layer.on({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mouseover: (e: any) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: '#ffffff',
                    fillColor: '#3B82F6', // Hover Blue (Brand Europe)
                    fillOpacity: 0.6,
                    dashArray: ''
                });
                layer.bringToFront();
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mouseout: (e: any) => {
                const layer = e.target;
                const style = getStyle(feature);
                layer.setStyle(style);
            },
            click: () => {
                const code = NormalizeCode(feature);
                console.log("Clicked Feature:", feature.properties.ADMIN, "-> Code:", code);
                if (code) {
                    if (onGuess) {
                        onGuess(code);
                    } else {
                        makeGuess(code);
                    }
                }
            }
        });
    }, [getStyle, onGuess, makeGuess]);

    if (!filteredData) return <div className="w-full h-full flex items-center justify-center text-soft-gray animate-pulse font-mono">Initializing Sat-Link...</div>;

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-brand-europe/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative bg-night">

            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

            <MapContainer
                center={[20, 0]}
                zoom={2.5}
                className="w-full h-full z-0 bg-transparent"
                minZoom={2}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                maxBounds={[[-90, -180], [90, 180]] as any}
                preferCanvas={true}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...{ updateWhenZooming: false, updateWhenIdle: true } as any}
                key={region} // Force re-mount ONLY on region change
            >
                {/* Dark Sci-Fi Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains='abcd'
                    maxZoom={19}
                />

                <GeoJSON
                    ref={geoJsonRef}
                    key={`${region}-${gameType}`}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data={filteredData as any}
                    style={getStyle}
                    onEachFeature={onEachFeature}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    pointToLayer={(feature: any, latlng: L.LatLng) => {
                        const code = NormalizeCode(feature);
                        const status = countryStatusRef.current[code];

                        let fillColor = '#3B82F6';
                        let color = '#ffffff';
                        let radius = 6;
                        // Specific sizes for Vatican and San Marino (Static as per user request)
                        if (code === 'VAT') radius = 8;
                        else if (code === 'SMR') radius = 7;
                        // Others like MLT, AND, LIE get default 6 or we can scale them if desired, 
                        // but user said "others yes [change], doesn't matter". 
                        // For consistency and visibility, keeping them as CircleMarkers is safest.

                        if (status === 'correct_1') { fillColor = '#22C55E'; color = '#86EFAC'; }
                        else if (status === 'correct_2') { fillColor = '#F59E0B'; color = '#FCD34D'; }
                        else if (status === 'correct_3') { fillColor = '#F97316'; color = '#FDBA74'; }
                        else if (status === 'failed') { fillColor = '#EF4444'; color = '#FCA5A5'; }

                        /* eslint-disable @typescript-eslint/no-explicit-any */
                        const marker = L.circleMarker(latlng, {
                            radius: radius,
                            fillColor: fillColor,
                            color: color,
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.9,
                            bubblingMouseEvents: false // Should help
                        });

                        // Explicitly stop propagation for common events
                        marker.on('mouseover', (e) => {
                            L.DomEvent.stopPropagation(e);
                        });
                        marker.on('click', (e) => {
                            L.DomEvent.stopPropagation(e);
                            if (onGuess) onGuess(code);
                            else makeGuess(code);
                        });

                        return marker;
                    }}
                />

                {/* Map Controller handles flying */}
                <MapController bounds={bounds} />
            </MapContainer>
        </div>
    );
};

export default React.memo(GameMap);
