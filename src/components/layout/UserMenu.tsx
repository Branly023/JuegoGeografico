import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserMenu = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1 bg-deep hover:bg-white/5 rounded-full border border-white/10 transition-colors"
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-europe flex items-center justify-center text-xs font-bold text-white">
                        {initials}
                    </div>
                )}
                <span className="text-sm font-medium text-soft-white hidden md:inline-block max-w-[100px] truncate">
                    {user.user_metadata?.full_name || user.email}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-deep border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-soft-gray">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={() => {
                            signOut();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-brand-asia hover:bg-brand-asia/10 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
