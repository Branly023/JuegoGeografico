import { useRef, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import ConfirmModal from '../common/ConfirmModal';

const HUD = () => {
    const { score, targetCountry, gameState, gameType, region, language, exitGame } = useGame();
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevScore = useRef<any>(score);

    useEffect(() => {
        prevScore.current = score;
    }, [score]);

    const LABELS = {
        en: { SCORE: 'Score', ATTEMPTS: 'Attempts', LOCATE: 'LOCATE TARGET', SUCCESS: 'Victory!', FAILED: 'Failed' },
        es: { SCORE: 'Puntuación', ATTEMPTS: 'Intentos', LOCATE: 'LOCALIZAR OBJETIVO', SUCCESS: '¡Victoria!', FAILED: 'Fallido' }
    };
    const t = LABELS[language];

    const displayName = targetCountry
        ? ((language === 'es' && targetCountry.translations?.spa?.common)
            ? targetCountry.translations.spa.common
            : targetCountry.name?.common)
        : '';

    return (
        <header className="relative z-50 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between pointer-events-none">
            {/* Left: Exit Button */}
            <div className="pointer-events-auto">
                <button
                    onClick={() => setShowExitConfirm(true)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-2 rounded text-xs border border-red-500/30 transition-colors font-bold"
                >
                    SALIR
                </button>
            </div>

            {/* Center: Target Display (Flag or Name) */}
            <div className="flex flex-col items-center pointer-events-auto">
                {targetCountry && (
                    <div className="relative group perspective-1000">
                        {gameType === 'flag' ? (
                            // Flag Mode
                            <div className="relative w-32 md:w-40 aspect-[3/2] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-white/10 transform transition-transform duration-500 hover:scale-110 hover:rotate-y-12">
                                <img
                                    src={targetCountry.flags.svg}
                                    alt="Target Flag"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                            </div>
                        ) : (
                            // Name Mode
                            <div className="relative px-8 py-4 bg-deep/60 backdrop-blur-md border border-brand-europe/30 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.2)] transform transition-transform duration-500 hover:scale-105">
                                <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-wide">
                                    {displayName.toUpperCase()}
                                </h2>
                                <div className="text-[10px] text-brand-europe text-center uppercase tracking-[0.3em] mt-1">
                                    {t.LOCATE}
                                </div>
                            </div>
                        )}

                        {/* Victory/Game Over Overlay (Mini) */}
                        {gameState === 'won' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-20">
                                <span className="text-emerald-400 font-bold uppercase animate-pulse">{t.SUCCESS}</span>
                            </div>
                        )}
                        {gameState === 'lost' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-20">
                                <span className="text-red-400 font-bold uppercase">{t.FAILED}</span>
                            </div>
                        )}

                        {/* Region Badge (Moved from Score panel) */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-deep/80 border border-white/10 rounded text-[10px] uppercase text-soft-gray whitespace-nowrap backdrop-blur-sm">
                            {region === 'World' ? 'GLOBAL' : region.toUpperCase()}
                        </div>
                    </div>
                )}
                {!targetCountry && gameState === 'loading' && (
                    <div className="text-slate-500 animate-pulse">Initializing...</div>
                )}
            </div>

            {/* Right: Placeholder for symmetry (optional score display) */}
            <div className="w-24 pointer-events-auto text-right">
                <span className="text-xs text-soft-gray font-mono">🏆 {score}</span>
            </div>

            {/* Exit Confirmation Modal */}
            <ConfirmModal
                isOpen={showExitConfirm}
                title="¿Salir de la Partida?"
                message="Tu progreso actual se perderá. ¿Estás seguro de que deseas abandonar?"
                confirmText="Sí, Salir"
                cancelText="Continuar Jugando"
                variant="danger"
                onConfirm={() => {
                    exitGame();
                    window.location.href = '/';
                }}
                onCancel={() => setShowExitConfirm(false)}
            />
        </header>
    );
};

export default HUD;
