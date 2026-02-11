import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../layout/Header';
import HUD from '../singleplayer/HUD';
import GameMap from '../map/GameMap';
import AuthModal from '../auth/AuthModal';
import { useGame } from '../../context/GameContext';

const GameLayout = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const location = useLocation();
    const { startGame, geoJson } = useGame();
    const initializedRef = useRef(false);

    // Initialize game when data is ready
    useEffect(() => {
        if (geoJson && !initializedRef.current) {
            const { mode, region } = location.state || { mode: 'flag', region: 'World' };
            console.log("Starting game with:", mode, region);
            startGame({ mode, region });
            initializedRef.current = true;
        }
    }, [geoJson, location.state, startGame]);

    return (
        <div className="relative w-full h-full min-h-screen overflow-hidden bg-night text-soft-white flex flex-col font-sans">
            {/* Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-europe/10 blur-[150px] rounded-full mix-blend-screen"></div>
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-americas/5 blur-[120px] rounded-full mix-blend-screen"></div>
            </div>

            <Header onLoginClick={() => setShowAuthModal(true)} />

            {/* Main Content - Responsive Map Container */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 py-2 md:py-4 flex flex-col relative z-10">
                {/* Map Container - 16:9 aspect ratio on desktop, flexible on mobile */}
                <div className="relative w-full flex-1 md:flex-none md:aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {/* HUD Overlay */}
                    <HUD />

                    {/* Map */}
                    <GameMap />
                </div>
            </main>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
};

export default GameLayout;
