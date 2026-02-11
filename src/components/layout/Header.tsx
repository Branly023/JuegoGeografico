import React from 'react';
import UserMenu from './UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';

interface HeaderProps {
    onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const { user } = useAuth();
    const { language, setLanguage } = useGame();

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

            {/* Middle: Brand / Title (Centered on mobile if needed, or keeping structure) */}
            <div className="flex-1"></div>

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
