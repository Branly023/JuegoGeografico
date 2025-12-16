import React from 'react';
import UserMenu from './UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';

interface HeaderProps {
    onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const { user } = useAuth();
    const { score, lives, language, setLanguage } = useGame();

    return (
        <header className="w-full h-16 bg-night/80 backdrop-blur-md border-b border-soft-white/5 flex items-center justify-between px-6 z-50 relative shrink-0">
            {/* Left: Brand / Title */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-tr from-brand-europe to-brand-americas rounded-lg shadow-lg shadow-brand-europe/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-soft-white to-soft-gray tracking-tight hidden sm:block">
                    GEO COMMAND
                </h1>
            </div>

            {/* Middle: Game Stats (Mobile/Desktop friendly) */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-soft-gray tracking-wider">Score</span>
                    <span className="text-xl font-mono font-bold text-brand-americas">{score}</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-soft-gray tracking-wider">Lives</span>
                    <div className="flex gap-1 mt-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < lives ? 'bg-brand-asia shadow-brand-asia/50 shadow-sm' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Language & User Auth */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-deep hover:bg-white/5 border border-white/10 rounded-lg transition-colors group"
                >
                    <span className={`text-xs font-bold font-mono ${language === 'en' ? 'text-brand-europe' : 'text-soft-gray'}`}>EN</span>
                    <span className="text-white/20 text-[10px]">|</span>
                    <span className={`text-xs font-bold font-mono ${language === 'es' ? 'text-brand-europe' : 'text-soft-gray'}`}>ES</span>
                </button>

                {user ? (
                    <UserMenu />
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="px-5 py-2 bg-brand-europe hover:bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-brand-europe/20 transition-all border border-brand-europe/20"
                    >
                        Login
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
