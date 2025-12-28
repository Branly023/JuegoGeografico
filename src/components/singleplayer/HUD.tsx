import { useRef, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import ConfirmModal from '../common/ConfirmModal';

const HUD = () => {
    const { score, targetCountry, gameState, gameType, region, language, exitGame, restartGame } = useGame();
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevScore = useRef<any>(score);

    useEffect(() => {
        prevScore.current = score;
    }, [score]);

    const LABELS = {
        en: {
            SCORE: 'Score',
            ATTEMPTS: 'Attempts',
            LOCATE: 'LOCATE TARGET',
            SUCCESS: 'Victory!',
            FAILED: 'Failed',
            RETRY: 'RETRY',
            EXIT: 'EXIT',
            EXIT_TITLE: 'Leave Game?',
            EXIT_MESSAGE: 'Your current progress will be lost. Are you sure you want to leave?',
            EXIT_CONFIRM: 'Yes, Leave',
            EXIT_CANCEL: 'Keep Playing',
            GLOBAL: 'GLOBAL',
            LOADING: 'Initializing...'
        },
        es: {
            SCORE: 'Puntuación',
            ATTEMPTS: 'Intentos',
            LOCATE: 'LOCALIZAR OBJETIVO',
            SUCCESS: '¡Victoria!',
            FAILED: 'Fallido',
            RETRY: 'REINTENTAR',
            EXIT: 'SALIR',
            EXIT_TITLE: '¿Salir de la Partida?',
            EXIT_MESSAGE: 'Tu progreso actual se perderá. ¿Estás seguro de que deseas abandonar?',
            EXIT_CONFIRM: 'Sí, Salir',
            EXIT_CANCEL: 'Continuar Jugando',
            GLOBAL: 'GLOBAL',
            LOADING: 'Cargando...'
        }
    };
    const t = LABELS[language];

    const displayName = targetCountry
        ? ((language === 'es' && targetCountry.translations?.spa?.common)
            ? targetCountry.translations.spa.common
            : targetCountry.name?.common)
        : '';

    const isGameOver = gameState === 'won' || gameState === 'lost';

    return (
        <header className="relative z-50 w-full max-w-7xl mx-auto px-8 py-6 flex items-center justify-between pointer-events-none">
            {/* Left: Exit Button + Retry Button */}
            <div className="pointer-events-auto flex items-center gap-3 min-w-[180px]">
                <button
                    onClick={() => setShowExitConfirm(true)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/40 px-4 py-2.5 rounded-lg text-sm border border-red-500/30 transition-all duration-300 font-bold hover:scale-105"
                >
                    {t.EXIT}
                </button>

                {/* Retry Button - Shows when game is over, next to exit */}
                {isGameOver && (
                    <button
                        onClick={restartGame}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wider"
                    >
                        🔄 {t.RETRY}
                    </button>
                )}
            </div>

            {/* Center: Target Display (Flag or Name) */}
            <div className="flex flex-col items-center pointer-events-auto">
                {targetCountry && (
                    <div className="relative group perspective-1000">
                        {gameType === 'flag' ? (
                            // Flag Mode
                            <div className="relative w-36 md:w-44 aspect-[3/2] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] border-2 border-white/15 transform transition-transform duration-500 hover:scale-110 hover:rotate-y-12">
                                <img
                                    src={targetCountry.flags.svg}
                                    alt="Target Flag"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                            </div>
                        ) : (
                            // Name Mode
                            <div className="relative px-10 py-5 bg-deep/60 backdrop-blur-md border border-brand-europe/30 rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.25)] transform transition-transform duration-500 hover:scale-105">
                                <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-wide">
                                    {displayName.toUpperCase()}
                                </h2>
                                <div className="text-[10px] text-brand-europe text-center uppercase tracking-[0.3em] mt-2">
                                    {t.LOCATE}
                                </div>
                            </div>
                        )}

                        {/* Victory/Game Over Overlay (Mini) */}
                        {gameState === 'won' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl z-20">
                                <span className="text-emerald-400 font-bold uppercase animate-pulse text-lg">{t.SUCCESS}</span>
                            </div>
                        )}
                        {gameState === 'lost' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl z-20">
                                <span className="text-red-400 font-bold uppercase text-lg">{t.FAILED}</span>
                            </div>
                        )}

                        {/* Region Badge */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-deep/80 border border-white/10 rounded-lg text-[11px] uppercase text-soft-gray whitespace-nowrap backdrop-blur-sm">
                            {region === 'World' ? t.GLOBAL : region.toUpperCase()}
                        </div>
                    </div>
                )}
                {!targetCountry && gameState === 'loading' && (
                    <div className="text-slate-500 animate-pulse text-lg">{t.LOADING}</div>
                )}
            </div>

            {/* Right: Score Display */}
            <div className="min-w-[180px] pointer-events-auto text-right">
                <div className="inline-flex items-center gap-2 bg-deep/60 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-white/10">
                    <span className="text-lg">🏆</span>
                    <span className="text-base text-soft-gray font-mono font-bold">{score}</span>
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            <ConfirmModal
                isOpen={showExitConfirm}
                title={t.EXIT_TITLE}
                message={t.EXIT_MESSAGE}
                confirmText={t.EXIT_CONFIRM}
                cancelText={t.EXIT_CANCEL}
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
