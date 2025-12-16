import { useState } from 'react';
import Header from '../layout/Header';
import HUD from '../singleplayer/HUD';
import GameMap from '../map/GameMap'; // Reusing the map component
import AuthModal from '../auth/AuthModal';
// Note: If HUD contains redundant score/lives, we might want to refactor HUD later too.

const GameLayout = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <div className="relative w-full h-full min-h-screen overflow-hidden bg-night text-soft-white flex flex-col font-sans">
            {/* Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-europe/10 blur-[150px] rounded-full mix-blend-screen"></div>
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-americas/5 blur-[120px] rounded-full mix-blend-screen"></div>
            </div>

            <Header onLoginClick={() => setShowAuthModal(true)} />

            {/* HUD: Keeping it for now if it displays other game info like "Target Country" */}
            <HUD />

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col relative z-10">
                <div className="flex-1 w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                    <GameMap />
                </div>
            </main>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
};

export default GameLayout;
