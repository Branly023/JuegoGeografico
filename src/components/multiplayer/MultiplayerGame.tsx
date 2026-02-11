import React, { useMemo, useState } from 'react';
import { Heart, Trophy } from 'lucide-react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import GameMap from '../map/GameMap';
import ConfirmModal from '../common/ConfirmModal';

const MultiplayerGame: React.FC = () => {
    const { gameState, players, submitAnswer, leaveRoom, guessedCountries, failedCountryAnimation } = useMultiplayer();
    const { filteredCountries, language } = useGame();
    const { user } = useAuth();
    const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

    // Refs for stable callbacks
    const gameStateRef = React.useRef(gameState);
    const guessedCountriesRef = React.useRef(guessedCountries);
    const playersRef = React.useRef(players);
    const userRef = React.useRef(user);

    // Update refs
    React.useEffect(() => {
        gameStateRef.current = gameState;
        guessedCountriesRef.current = guessedCountries;
        playersRef.current = players;
        userRef.current = user;
    }, [gameState, guessedCountries, players, user]);

    const [interstitial, setInterstitial] = React.useState<string | null>(null);

    // Track the last turn we triggered the animation for
    const lastTurnRef = React.useRef<string | null>(null);

    // Effect: Trigger 3-2-1 on turn change
    React.useEffect(() => {
        if (!gameState?.current_turn) return;

        if (lastTurnRef.current === gameState.current_turn) {
            return;
        }

        lastTurnRef.current = gameState.current_turn;

        console.log("🎬 Triggering Interstitial for turn:", gameState.current_turn);

        setInterstitial('3');
        const t1 = setTimeout(() => setInterstitial('2'), 1000);
        const t2 = setTimeout(() => setInterstitial('1'), 2000);

        const playerForTurn = players.find(p => p.player_id === gameState.current_turn);
        const name = playerForTurn?.profile?.username || 'Jugador';
        const finalMsg = (user?.id === gameState.current_turn) ? '¡TU TURNO!' : `Turno de ${name}`;

        const t3 = setTimeout(() => setInterstitial(finalMsg), 3000);
        const t4 = setTimeout(() => setInterstitial(null), 4500);

        return () => {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
        };
    }, [gameState?.current_turn, players, user?.id]);

    // Derived state
    const currentTurnPlayer = useMemo(() => {
        return players.find(p => p.player_id === gameState?.current_turn);
    }, [players, gameState?.current_turn]);

    const isMyTurn = user?.id === gameState?.current_turn;

    // Find target country object
    const targetCountryCode = gameState?.current_question?.country;
    const targetCountry = useMemo(() => {
        if (!targetCountryCode || !filteredCountries) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return filteredCountries.find((c: any) => c.cca3 === targetCountryCode || c.name.common === targetCountryCode);
    }, [targetCountryCode, filteredCountries]);

    // Get display name based on language
    const displayName = targetCountry
        ? ((language === 'es' && targetCountry.translations?.spa?.common)
            ? targetCountry.translations.spa.common
            : targetCountry.name?.common)
        : '';

    // Convert guessedCountries to countryStatus format for GameMap
    const countryStatus = useMemo(() => {
        const status: Record<string, string> = {};
        Object.entries(guessedCountries).forEach(([code, result]) => {
            status[code] = result === 'correct' ? 'correct_1' : 'failed';
        });
        return status;
    }, [guessedCountries]);

    // Resolve Failed Country Object for Animation
    const failedCountryObject = useMemo(() => {
        if (!failedCountryAnimation || !filteredCountries) return null;
        // @ts-ignore
        return filteredCountries.find((c: any) => c.cca3 === failedCountryAnimation);
    }, [failedCountryAnimation, filteredCountries]);

    // Handle Guess (Stable Callback)
    const handleGuess = React.useCallback(async (code: string) => {
        const currentGameState = gameStateRef.current;
        const currentGuessed = guessedCountriesRef.current;
        const currentUser = userRef.current;

        console.log(`🌍 Map Clicked: ${code}`);

        if (!currentUser) { console.log("Blocked: No User"); return; }
        if (!currentGameState) { console.log("Blocked: No Game State"); return; }

        const isTurn = currentUser.id === currentGameState.current_turn;
        console.log(`👤 User: ${currentUser.id}, Turn: ${currentGameState.current_turn}, IsTurn: ${isTurn}`);

        if (!isTurn) { console.log("Blocked: Not My Turn"); return; }

        if (currentGuessed[code]) {
            console.log(`Country ${code} already guessed, ignoring.`);
            return;
        }

        const targetCode = currentGameState.current_question?.country;
        const isCorrect = code === targetCode;

        console.log(`Guessed: ${code}, Target: ${targetCode}, Correct: ${isCorrect}`);

        let nextQuestion = undefined;
        if (filteredCountries && filteredCountries.length > 0) {
            const excludedCountries = new Set<string>();
            Object.keys(currentGuessed).forEach(code => excludedCountries.add(code));
            if (targetCode) excludedCountries.add(targetCode);
            if (isCorrect && code) excludedCountries.add(code);

            const availableCountries = filteredCountries.filter(
                (c: any) => !excludedCountries.has(c.cca3)
            );

            if (availableCountries.length > 0) {
                const randomCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
                nextQuestion = { type: 'flag', country: randomCountry.cca3, options: [] };
            }
        }

        await submitAnswer({
            isCorrect,
            guessedCountry: code,
            nextQuestion,
            turnAtClick: currentGameState.current_turn
        });

    }, [submitAnswer, filteredCountries]);

    if (!gameState) return <div className="w-full h-screen bg-night flex items-center justify-center text-white">Loading Game State...</div>;

    return (
        <div className="w-full h-screen bg-night text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-europe/10 blur-[150px] rounded-full mix-blend-screen"></div>
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-americas/5 blur-[120px] rounded-full mix-blend-screen"></div>
            </div>

            {/* INTERSTITIAL OVERLAY */}
            {interstitial && (
                <div className="absolute inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-asia to-emerald-400 animate-bounce">
                        {interstitial}
                    </div>
                </div>
            )}

            {/* Background Music */}
            <audio autoPlay loop>
                <source src="/music/background_loop.mp3" type="audio/mp3" />
            </audio>

            {/* Main Content - Rectangular Map */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col relative z-10">
                <div className="relative w-full flex-1 md:flex-none md:aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10">

                    {/* HUD Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20 p-2 sm:p-4">

                        {/* Top Row - Surrender button on left, Turn info + Players on right */}
                        <div className="flex items-start justify-between">
                            {/* Left: Title + Surrender */}
                            <div className="pointer-events-auto flex items-center gap-2">
                                <div className="hidden sm:block text-lg font-black text-brand-europe bg-deep/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-brand-europe/30">
                                    MAP BATTLE
                                </div>
                                <button
                                    onClick={() => setShowSurrenderConfirm(true)}
                                    className="bg-red-500/30 text-red-400 hover:bg-red-500/50 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-red-500/40 transition-all font-bold backdrop-blur-sm"
                                >
                                    RENDIRSE
                                </button>
                            </div>

                            {/* Right: Turn Info + Players */}
                            <div className="pointer-events-auto flex items-center gap-2">
                                {/* Turn Indicator */}
                                <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold backdrop-blur-sm border ${isMyTurn
                                    ? 'bg-brand-europe/30 border-brand-europe/50 text-brand-europe'
                                    : 'bg-deep/70 border-white/10 text-soft-gray'}`}>
                                    {isMyTurn
                                        ? "TU TURNO"
                                        : `${currentTurnPlayer?.profile?.username || 'Jugador'}...`}
                                </div>

                                {/* Players Mini List */}
                                <div className="hidden md:flex items-center gap-2 bg-deep/70 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-white/10">
                                    {players.map(p => (
                                        <div
                                            key={p.player_id}
                                            className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${gameState.current_turn === p.player_id ? 'bg-brand-europe/30 ring-1 ring-brand-europe/50' : 'bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1 text-red-400" title="Vidas">
                                                <Heart className="w-3 h-3 fill-current" />
                                                <span className="text-[10px] font-bold">{p.lives}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-400" title="Puntos">
                                                <Trophy className="w-3 h-3 fill-current" />
                                                <span className="text-[10px] font-bold">{p.score}</span>
                                            </div>
                                            <span className="text-[10px] text-soft-gray truncate max-w-[60px]">{p.profile?.username}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center: Target Display */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-2 sm:top-4 pointer-events-auto">
                            {targetCountry && (
                                <div className="relative">
                                    <div className="relative w-20 sm:w-28 md:w-36 aspect-[3/2] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-white/20">
                                        <img
                                            src={targetCountry.flags?.svg}
                                            alt="Target Flag"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                                    </div>
                                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-deep/80 border border-white/10 rounded text-[9px] sm:text-[10px] uppercase text-soft-gray whitespace-nowrap backdrop-blur-sm">
                                        {displayName}
                                    </div>
                                </div>
                            )}
                            {!targetCountry && (
                                <div className="text-slate-500 animate-pulse text-sm bg-deep/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                                    Preparando...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map */}
                    <GameMap
                        onGuess={handleGuess}
                        overrideTarget={failedCountryObject || targetCountry}
                        countryStatus={countryStatus}
                        isTransitioning={!!failedCountryAnimation}
                    />

                    {/* Failed Country Animation Overlay */}
                    {failedCountryAnimation && (
                        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 pointer-events-none">
                            <div className="text-center">
                                <div className="text-6xl md:text-8xl animate-pulse mb-4">❌</div>
                                <div className="text-2xl md:text-4xl font-black text-red-400 animate-bounce">
                                    ¡Nadie acertó!
                                </div>
                                <div className="text-lg text-soft-gray mt-2">
                                    El país era: <span className="text-white font-bold">{failedCountryAnimation}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wait Turn Indicator */}
                    {!isMyTurn && !interstitial && !failedCountryAnimation && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                            <div className="bg-black/70 backdrop-blur text-white px-4 py-2 rounded-full text-sm border border-white/20">
                                Espera tu turno...
                            </div>
                        </div>
                    )}

                    {/* Interaction Blocker */}
                    {(!isMyTurn || !!interstitial || !!failedCountryAnimation) && (
                        <div
                            className="absolute inset-0 z-50 bg-transparent cursor-not-allowed"
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log("🚫 Interaction blocked by overlay");
                            }}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            </main>

            {/* Surrender Confirmation Modal */}
            <ConfirmModal
                isOpen={showSurrenderConfirm}
                title="¿Rendirse?"
                message="Perderás todos tus puntos y se te contará como derrota. ¿Estás seguro?"
                confirmText="Sí, Rendirse"
                cancelText="Continuar"
                variant="danger"
                onConfirm={() => {
                    leaveRoom();
                    setShowSurrenderConfirm(false);
                }}
                onCancel={() => setShowSurrenderConfirm(false)}
            />
        </div>
    );
};

export default MultiplayerGame;
