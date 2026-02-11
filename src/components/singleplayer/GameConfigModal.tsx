
import React, { useState } from 'react';
import { type GameType, type Region } from '../../context/GameContext';
import { Globe, Map, Flag, Type, Check, Rocket, X } from 'lucide-react';

interface GameConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (mode: GameType, region: Region) => void;
}

const REGIONS: { id: Region; label: string; icon: React.ReactNode; color: string; image: string }[] = [
    { id: 'World', label: 'Mundo Completo', icon: <Globe className="w-6 h-6" />, color: 'bg-blue-500', image: 'https://5z2prz7boj.ucarecd.net/383c1475-888c-4ec8-ac60-4df28c2b204c/-/preview/1000x666/' },
    { id: 'Africa', label: 'África', icon: <Map className="w-6 h-6" />, color: 'bg-yellow-500', image: 'https://5z2prz7boj.ucarecd.net/64185d60-268c-42ce-a35a-1ec6f44f1aa7/-/preview/666x1000/' },
    { id: 'Americas', label: 'América', icon: <Map className="w-6 h-6" />, color: 'bg-green-500', image: 'https://5z2prz7boj.ucarecd.net/e332ea48-06c2-4c3e-bfbe-4d033749a632/-/preview/666x1000/' },
    { id: 'Asia', label: 'Asia', icon: <Map className="w-6 h-6" />, color: 'bg-red-500', image: 'https://5z2prz7boj.ucarecd.net/ea8ad448-22e8-4655-96f0-0a69cf182d50/-/preview/666x1000/' },
    { id: 'Europe', label: 'Europa', icon: <Map className="w-6 h-6" />, color: 'bg-blue-400', image: 'https://5z2prz7boj.ucarecd.net/7132659b-8d9d-4927-8289-31411c7e6b80/-/preview/1000x666/' },
    { id: 'Oceania', label: 'Oceanía', icon: <Map className="w-6 h-6" />, color: 'bg-purple-500', image: 'https://5z2prz7boj.ucarecd.net/1fa613ae-dfca-4bde-ac04-eb084fc34a79/-/preview/666x1000/' },
];

const GameConfigModal: React.FC<GameConfigModalProps> = ({ isOpen, onClose, onStart }) => {
    const [selectedMode, setSelectedMode] = useState<GameType>('name'); // Default to name based on user pref description "choose mode"
    const [selectedRegion, setSelectedRegion] = useState<Region>('World');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-night/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-deep border border-white/10 rounded-2xl w-full max-w-4xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-soft-gray hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-black text-white mb-2">Configura tu Partida</h2>
                <p className="text-soft-gray mb-8">Personaliza tu experiencia de juego en solitario.</p>

                {/* 1. Game Mode Selection */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-brand-europe/20 text-brand-europe flex items-center justify-center text-xs">1</span>
                        Modo de Juego
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedMode('flag')}
                            className={`p-4 rounded-xl border-2 transition-all text-left group flex items-start gap-4 ${selectedMode === 'flag'
                                ? 'border-brand-americas bg-brand-americas/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                : 'border-white/5 bg-white/5 hover:border-brand-americas/50 hover:bg-white/10'
                                } `}
                        >
                            <div className={`p-3 rounded-lg ${selectedMode === 'flag' ? 'bg-brand-americas text-white' : 'bg-white/10 text-soft-gray group-hover:text-white'}`}>
                                <Flag className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Por Bandera</div>
                                <p className="text-sm text-soft-gray">Se te muestra un país en el mapa y debes elegir la bandera correcta (o viceversa).</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedMode('name')}
                            className={`p-4 rounded-xl border-2 transition-all text-left group flex items-start gap-4 ${selectedMode === 'name'
                                ? 'border-brand-europe bg-brand-europe/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                : 'border-white/5 bg-white/5 hover:border-brand-europe/50 hover:bg-white/10'
                                } `}
                        >
                            <div className={`p-3 rounded-lg ${selectedMode === 'name' ? 'bg-brand-europe text-white' : 'bg-white/10 text-soft-gray group-hover:text-white'}`}>
                                <Type className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Por Nombre</div>
                                <p className="text-sm text-soft-gray">Localiza el país solicitado por su nombre en el mapa.</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 2. Region Selection */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-brand-europe/20 text-brand-europe flex items-center justify-center text-xs">2</span>
                        Región
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {REGIONS.map((region) => (
                            <button
                                key={region.id}
                                onClick={() => setSelectedRegion(region.id)}
                                className={`relative group overflow-hidden rounded-xl border-2 transition-all aspect-video ${selectedRegion === region.id
                                    ? 'border-brand-europe shadow-lg ring-2 ring-brand-europe/50'
                                    : 'border-white/10 hover:border-white/30'
                                    } `}
                            >
                                {/* Background Image with Gradient Overlay */}
                                <div className="absolute inset-0">
                                    <img
                                        src={region.image}
                                        alt={region.label}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent ${selectedRegion === region.id ? 'opacity-80' : 'opacity-60 group-hover:opacity-50'
                                        }`} />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                                    <div className={`mb-2 transition-transform duration-300 ${selectedRegion === region.id ? 'scale-110 text-brand-europe' : 'text-white'}`}>
                                        {region.icon}
                                    </div>
                                    <span className={`font-bold text-sm sm:text-base ${selectedRegion === region.id ? 'text-white' : 'text-gray-200'}`}>
                                        {region.label}
                                    </span>
                                </div>

                                {/* Selected Indicator */}
                                {selectedRegion === region.id && (
                                    <div className="absolute top-2 right-2 bg-brand-europe text-white p-1 rounded-full shadow-lg">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={() => onStart(selectedMode, selectedRegion)}
                        className="px-8 py-4 bg-brand-europe hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-europe/30 transition-all transform hover:-translate-y-1 w-full md:w-auto flex items-center justify-center gap-2"
                    >
                        <span>Comenzar Misión</span>
                        <Rocket className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameConfigModal;
