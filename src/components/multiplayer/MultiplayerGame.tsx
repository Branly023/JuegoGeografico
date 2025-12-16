import React, { useMemo } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import GameMap from '../map/GameMap';

const MultiplayerGame: React.FC = () => {
    const { gameState, players, submitAnswer } = useMultiplayer();
    const { filteredCountries } = useGame(); // Use this to lookup country details
    const auth = useAuth();

    // Derived state
    const currentTurnPlayer = useMemo(() => {
        return players.find(p => p.player_id === gameState?.current_turn);
    }, [players, gameState?.current_turn]);

    const isMyTurn = auth.user?.id === gameState?.current_turn;

    // Find target country object
    const targetCountryCode = gameState?.current_question?.country;
    const targetCountry = useMemo(() => {
        if (!targetCountryCode || !filteredCountries) return null;
        // Try to match cca3 or name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return filteredCountries.find((c: any) => c.cca3 === targetCountryCode || c.name.common === targetCountryCode);
    }, [targetCountryCode, filteredCountries]);


    // Handle Guess
    const handleGuess = async (code: string) => {
        if (!isMyTurn) return; // Ignore if not my turn
        if (!gameState) return;

        // Verify answer
        const isCorrect = code === targetCountryCode || code === targetCountry?.cca3;

        console.log(`Guessed: ${code}, Target: ${targetCountryCode}, Correct: ${isCorrect}`);

        // Generate next question (client-side for now, ideally backend)
        let nextQuestion = undefined;
        if (filteredCountries && filteredCountries.length > 0) {
            const randomCountry = filteredCountries[Math.floor(Math.random() * filteredCountries.length)];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nextQuestion = { type: 'flag', country: (randomCountry as any).cca3, options: [] };
        }

        await submitAnswer(isCorrect, nextQuestion);
    };

    if (!gameState) return <div>Loading Game State...</div>;

    return (
        <div className="w-full h-screen bg-night text-white flex flex-col">
            {/* Top Bar: HUD */}
            <header className="px-6 py-4 bg-deep/80 border-b border-white/10 flex justify-between items-center z-50">
                <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-brand-europe">MAP BATTLE</div>
                    <div className="bg-white/10 px-3 py-1 rounded text-sm text-soft-gray font-mono">
                        TIME: {gameState.time_left}s
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    {targetCountry ? (
                        <div className="text-center animate-pulse">
                            <span className="text-sm text-soft-gray block">LOCALIZA</span>
                            {/* Check if flag property exists or handle generic */}
                            <span className="text-xl md:text-3xl font-black text-white">
                                {targetCountry.name?.common || targetCountryCode}
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(targetCountry as any).flag}
                            </span>
                        </div>
                    ) : (
                        <div className="text-soft-gray">Preparando siguiente objetivo...</div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className={`text-right ${isMyTurn ? 'text-brand-europe font-bold' : 'text-soft-gray'}`}>
                        {isMyTurn ? "TU TURNO" : `Turno de: ${currentTurnPlayer?.profile?.username || 'Jugador'}`}
                    </div>
                </div>
            </header>

            {/* Main Content: Map + Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Players Sidebar (Left) */}
                <aside className="w-64 bg-deep/50 border-r border-white/5 p-4 overflow-y-auto hidden md:block">
                    <h3 className="font-bold mb-4 text-sm text-soft-gray uppercase tracking-wider">Jugadores</h3>
                    <div className="space-y-3">
                        {players.map(p => (
                            <div key={p.player_id} className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${gameState.current_turn === p.player_id
                                ? 'bg-brand-europe/20 border-brand-europe/50'
                                : 'bg-white/5 border-white/10'
                                }`}>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                    {p.profile?.avatar_url ? (
                                        <img src={p.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold">{(p.profile?.username?.[0] || '?').toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm truncate">{p.profile?.username || 'Anónimo'}</div>
                                    <div className="flex justify-between text-xs text-soft-gray mt-1">
                                        <span>❤️ {p.lives}</span>
                                        <span>🏆 {p.score}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Map Area */}
                <main className="flex-1 relative">
                    <GameMap
                        onGuess={handleGuess}
                        overrideTarget={targetCountry}
                    />

                    {/* Turn Indicator Overlay (Mobile/Visual) */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                        {!isMyTurn && (
                            <div className="bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-sm border border-white/10">
                                Espera tu turno
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MultiplayerGame;
