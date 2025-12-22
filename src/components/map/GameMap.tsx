import React from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGame } from '../../context/GameContext';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';

// Maps territory codes to their sovereign country code (Game Target)
import { NormalizeCode } from '../../utils/mapUtils';

const SMALL_COUNTRIES = new Set([
    'VAT', // Vaticano
    'SMR', // San Marino
    'MCO', // Monaco
    'GIB', // Gibraltar
    'AND', // Andorra
    'MLT', // Malta
    'LIE', // Liechtenstein
    'IMN', // Isla de Man
    'LUX', // Luxemburgo
    'JEY', // Jersey
    'GGY', // Guernsey
    // Oceania Microstates
    'FJI', // Fiji
    'KIR', // Kiribati
    'MHL', // Marshall Islands
    'FSM', // Micronesia
    'NRU', // Nauru
    'PLW', // Palau
    'WSM', // Samoa
    'SLB', // Solomon Islands
    'TON', // Tonga
    'TUV', // Tuvalu
    'VUT'  // Vanuatu
]);

function getFeatureCenter(feature: any): L.LatLng {
    const layer = L.geoJSON(feature);
    return layer.getBounds().getCenter();
}

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
    const smallMarkersRef = useRef<L.CircleMarker[]>([]);

    // Update ref when countryStatus changes
    useEffect(() => {
        countryStatusRef.current = countryStatus;

        // Update styles of manual markers too
        smallMarkersRef.current.forEach(marker => {
            // @ts-ignore
            const code = marker._code;
            if (code) {
                const status = countryStatus[code];
                let fillColor = '#3B82F6';
                let color = '#ffffff';

                if (status === 'correct_1') { fillColor = '#22C55E'; color = '#86EFAC'; }
                else if (status === 'correct_2') { fillColor = '#F59E0B'; color = '#FCD34D'; }
                else if (status === 'correct_3') { fillColor = '#F97316'; color = '#FDBA74'; }
                else if (status === 'failed') { fillColor = '#EF4444'; color = '#FCA5A5'; }

                marker.setStyle({ fillColor, color });
            }
        });

    }, [countryStatus]);



    // Filter GeoJSON based on active countries (Region Filter)
    const filteredData = useMemo(() => {
        if (!geoJson || !filteredCountries || !filteredCountries.length) return null;

        const validCodes = new Set(filteredCountries.map(c => c.cca3));

        // Only force Kosovo if we are in Europe or World mode
        // Assuming 'filteredCountries' usually contains it if the API returns it, 
        // but if we need to force it for Europe specifically:
        if (region === 'Europe' || region === 'World') {
            validCodes.add('XKX');
            validCodes.add('KOS');
        }

        // Filter features
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features = geoJson.features.filter((f: any) => {
            const code = NormalizeCode(f);
            return validCodes.has(code);
        });

        return { type: 'FeatureCollection', features };
    }, [geoJson, filteredCountries]);

    // Cleanup manual markers on unmount or data change
    useEffect(() => {
        return () => {
            smallMarkersRef.current.forEach(m => m.remove());
            smallMarkersRef.current = [];
        };
    }, [filteredData]); // Dependent on data change

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

        // HIDE original polygon for small countries
        if (SMALL_COUNTRIES.has(code)) {
            return { opacity: 0, fillOpacity: 0, interactive: false };
        }

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
        const code = NormalizeCode(feature);

        if (!SMALL_COUNTRIES.has(code)) {
            // Enhanced Interaction Handling
            layer.on({
                // Mouse Down: Start tracking for Click vs Drag
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mousedown: (e: any) => {
                    layer._downLatLng = e.latlng;
                },

                // Mouse Up: Validate Click (Distance check)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mouseup: (e: any) => {
                    if (!layer._downLatLng) return;

                    // Let's use the robust pixel tracking:
                    const startPx = layer._map.latLngToContainerPoint(layer._downLatLng);
                    const endPx = layer._map.latLngToContainerPoint(e.latlng);
                    const distPx = startPx.distanceTo(endPx);

                    if (distPx > 5) return; // 5 pixels tolerance

                    console.log("Clicked Feature:", feature.properties.ADMIN, "-> Code:", code);
                    if (code) {
                        if (onGuess) {
                            onGuess(code);
                        } else {
                            makeGuess(code);
                        }
                    }
                },

                // Hover: Controlled State (No React State)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mouseover: (e: any) => {
                    // @ts-ignore
                    if (propsTransitioning) return; // Don't hover during animations

                    const layer = e.target;
                    layer._isHovered = true; // Flag for external re-renders to respect

                    layer.setStyle({
                        weight: 2,
                        color: '#ffffff',
                        fillColor: '#3B82F6', // Hover Blue
                        fillOpacity: 0.6,
                        dashArray: ''
                    });
                    layer.bringToFront();
                },

                // Mouse Out: Restore
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mouseout: (e: any) => {
                    const layer = e.target;
                    layer._isHovered = false;

                    // Reset to current correct style
                    const style = getStyle(feature);
                    layer.setStyle(style);
                }
            });
            return;
        }

        // Logic for SMALL COUNTRIES
        // 1. Disable interaction on the polygon/point layer itself to prevent conflicts (e.g., Italy vs San Marino)
        layer.options.interactive = false;
        if (layer.setStyle) {
            layer.setStyle({ opacity: 0, fillOpacity: 0 });
        }

        const center = getFeatureCenter(feature);
        const status = countryStatusRef.current[code];

        let radius = 6;
        if (code === 'VAT') radius = 8;
        if (code === 'SMR') radius = 7;
        if (code === 'MLT') radius = 7;
        if (code === 'AND') radius = 7;

        let fillColor = '#3B82F6';
        let color = '#ffffff';

        if (status === 'correct_1') { fillColor = '#22C55E'; color = '#86EFAC'; }
        else if (status === 'correct_2') { fillColor = '#F59E0B'; color = '#FCD34D'; }
        else if (status === 'correct_3') { fillColor = '#F97316'; color = '#FDBA74'; }
        else if (status === 'failed') { fillColor = '#EF4444'; color = '#FCA5A5'; }

        // 2. Create independent marker using SVG renderer for fixed size
        const marker = L.circleMarker(center, {
            radius,
            fillColor,
            color,
            weight: 2,
            fillOpacity: 0.9,
            renderer: L.svg(), // Force SVG to prevent zooming scaling issues
            interactive: true,
            bubblingMouseEvents: false
        });

        // Attach code to marker for future updates
        // @ts-ignore
        marker._code = code;

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            console.log("Clicked Small Country:", code);
            if (onGuess) onGuess(code);
            else makeGuess(code);
        });

        // Add to map safely
        const addToMap = () => {
            if (layer._map) {
                marker.addTo(layer._map);
                smallMarkersRef.current.push(marker);
                // Ensure small markers are on top
                marker.bringToFront();
            }
        };

        if (layer._map) {
            addToMap();
        } else {
            layer.on('add', addToMap);
        }

    }, [getStyle, onGuess, makeGuess, propsTransitioning]);

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
                        // If it's a small country, return an invisible marker 
                        // because onEachFeature will add the "Real" CircleMarker.
                        if (SMALL_COUNTRIES.has(code)) {
                            return L.circleMarker(latlng, { radius: 0, opacity: 0, fillOpacity: 0, interactive: false });
                        }

                        // Default behavior for other points (if any)
                        return L.circleMarker(latlng);
                    }}
                />

                {/* Map Controller handles flying */}
                <MapController bounds={bounds} />
            </MapContainer>
        </div>
    );
};

export default React.memo(GameMap);
