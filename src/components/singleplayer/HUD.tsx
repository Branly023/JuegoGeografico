import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import ConfirmModal from '../common/ConfirmModal';
import { Heart, Trophy } from 'lucide-react';

const HUD = () => {
    const { score, targetCountry, gameState, gameType, region, language, exitGame, restartGame, lives } = useGame();
    const [showExitConfirm, setShowExitConfirm] = useState(false);

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

    // Get display name based on language
    const displayName = targetCountry
        ? ((language === 'es' && targetCountry.translations?.spa?.common)
            ? targetCountry.translations.spa.common
            : targetCountry.name?.common)
        : '';

    // Lives indicators
    const hearts = Array(3).fill(0).map((_, i) => (
        <Heart
            key={i}
            className={`w-5 h-5 transition-all duration-300 ${i < lives ? 'text-red-500 fill-red-500' : 'text-white/20'}`}
        />
    ));

    return (
        <>
            {/* HUD Overlay - Absolute positioned over the map */}
            <div className="absolute inset-0 pointer-events-none z-20 p-2 sm:p-4 md:p-6">

                {/* Top Row - Exit/Retry buttons on left, Score/Lives on right */}
                <div className="flex items-start justify-between">
                    {/* Left: Exit + Retry */}
                    <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            className="bg-red-500/30 text-red-400 hover:bg-red-500/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm border border-red-500/40 transition-all font-bold backdrop-blur-sm"
                        >
                            {t.EXIT}
                        </button>
                        <button
                            onClick={restartGame}
                            className="bg-amber-500/30 text-amber-400 hover:bg-amber-500/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm border border-amber-500/40 transition-all font-bold backdrop-blur-sm"
                        >
                            {t.RETRY}
                        </button>
                    </div>

                    {/* Right: Score + Lives */}
                    <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
                        {/* Lives */}
                        <div className="flex items-center gap-1 bg-deep/70 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/10">
                            {hearts}
                        </div>
                        {/* Score */}
                        <div className="flex items-center gap-1.5 bg-deep/70 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/10">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm sm:text-base text-soft-gray font-mono font-bold">{score}</span>
                        </div>
                    </div>
                </div>

                {/* Center: Target Display */}
                <div className="absolute left-1/2 -translate-x-1/2 top-2 sm:top-4 md:top-6 pointer-events-auto">
                    {targetCountry && (
                        <div className="relative group">
                            {gameType === 'flag' ? (
                                // Flag Mode
                                <div className="relative w-20 sm:w-28 md:w-36 aspect-[3/2] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-white/20 transition-transform duration-300 hover:scale-105">
                                    <img
                                        src={targetCountry.flags.svg}
                                        alt="Target Flag"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                                </div>
                            ) : (
                                // Name Mode
                                <div className="relative px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-deep/80 backdrop-blur-md border border-brand-europe/40 rounded-lg sm:rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                    <h2 className="text-base sm:text-xl md:text-2xl font-black text-white text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] tracking-wide">
                                        {displayName.toUpperCase()}
                                    </h2>
                                    <div className="text-[8px] sm:text-[10px] text-brand-europe text-center uppercase tracking-widest mt-1">
                                        {t.LOCATE}
                                    </div>
                                </div>
                            )}

                            {/* Victory/Game Over Overlay */}
                            {gameState === 'won' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg sm:rounded-xl z-20">
                                    <span className="text-emerald-400 font-bold uppercase animate-pulse text-sm sm:text-lg">{t.SUCCESS}</span>
                                </div>
                            )}
                            {gameState === 'lost' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg sm:rounded-xl z-20">
                                    <span className="text-red-400 font-bold uppercase text-sm sm:text-lg">{t.FAILED}</span>
                                </div>
                            )}

                            {/* Region Badge */}
                            <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-deep/80 border border-white/10 rounded text-[9px] sm:text-[10px] uppercase text-soft-gray whitespace-nowrap backdrop-blur-sm">
                                {region === 'World' ? t.GLOBAL : region.toUpperCase()}
                            </div>
                        </div>
                    )}
                    {!targetCountry && gameState === 'loading' && (
                        <div className="text-slate-500 animate-pulse text-sm sm:text-lg">{t.LOADING}</div>
                    )}
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
        </>
    );
};

export default HUD;
