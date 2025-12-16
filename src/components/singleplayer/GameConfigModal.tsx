
import React, { useState } from 'react';
import { type GameType, type Region } from '../../context/GameContext';

interface GameConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (mode: GameType, region: Region) => void;
}

const REGIONS: { id: Region; label: string; icon: string; color: string }[] = [
    { id: 'World', label: 'Mundo Completo', icon: '🌍', color: 'bg-blue-500' },
    { id: 'Africa', label: 'África', icon: '🦁', color: 'bg-yellow-500' },
    { id: 'Americas', label: 'América', icon: '🦅', color: 'bg-green-500' },
    { id: 'Asia', label: 'Asia', icon: '🐉', color: 'bg-red-500' },
    { id: 'Europe', label: 'Europa', icon: '🏰', color: 'bg-blue-400' },
    { id: 'Oceania', label: 'Oceanía', icon: '🦘', color: 'bg-purple-500' },
];

const GameConfigModal: React.FC<GameConfigModalProps> = ({ isOpen, onClose, onStart }) => {
    const [selectedMode, setSelectedMode] = useState<GameType>('name'); // Default to name based on user pref description "choose mode"
    const [selectedRegion, setSelectedRegion] = useState<Region>('World');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-night/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-deep border border-white/10 rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-soft-gray hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
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
                            className={`p - 4 rounded - xl border - 2 transition - all text - left group ${selectedMode === 'flag'
                                ? 'border-brand-americas bg-brand-americas/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                : 'border-white/5 bg-white/5 hover:border-brand-americas/50 hover:bg-white/10'
                                } `}
                        >
                            <div className="text-3xl mb-2">🏳️</div>
                            <div className="font-bold text-white mb-1">Por Bandera</div>
                            <p className="text-sm text-soft-gray">Se te muestra un país en el mapa y debes elegir la bandera correcta (o viceversa).</p>
                        </button>

                        <button
                            onClick={() => setSelectedMode('name')}
                            className={`p - 4 rounded - xl border - 2 transition - all text - left group ${selectedMode === 'name'
                                ? 'border-brand-europe bg-brand-europe/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                : 'border-white/5 bg-white/5 hover:border-brand-europe/50 hover:bg-white/10'
                                } `}
                        >
                            <div className="text-3xl mb-2">🔤</div>
                            <div className="font-bold text-white mb-1">Por Nombre</div>
                            <p className="text-sm text-soft-gray">Localiza el país solicitado por su nombre en el mapa.</p>
                        </button>
                    </div>
                </div>

                {/* 2. Region Selection */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-brand-europe/20 text-brand-europe flex items-center justify-center text-xs">2</span>
                        Región
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {REGIONS.map((region) => (
                            <button
                                key={region.id}
                                onClick={() => setSelectedRegion(region.id)}
                                className={`p - 3 rounded - lg border transition - all flex flex - col items - center justify - center gap - 2 ${selectedRegion === region.id
                                    ? 'border-brand-europe bg-brand-europe text-white shadow-lg'
                                    : 'border-white/10 bg-white/5 text-soft-gray hover:bg-white/10 hover:text-white'
                                    } `}
                            >
                                <span className="text-2xl">{region.icon}</span>
                                <span className="text-sm font-bold">{region.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={() => onStart(selectedMode, selectedRegion)}
                        className="px-8 py-4 bg-brand-europe hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-europe/30 transition-all transform hover:-translate-y-1 w-full md:w-auto"
                    >
                        Comenzar Misión 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameConfigModal;
