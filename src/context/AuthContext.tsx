import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Define the shape of the Profile based on usage
export interface UserProfile {
    id: string;
    username?: string;
    avatar_url?: string;
    // Add other fields as they become apparent
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithFacebook: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    useEffect(() => {
        // Build the current URL for redirect (handles both dev and prod if deployed)
        // const redirectUrl = window.location.origin;

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false); // Only set loading false here if no user, otherwise wait for profile? 
                // Actually better to just set loading false after session check
                // and let profile load async to not block UI if checks fail
            }
            if (!session?.user) setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                fetchProfile(currentUser.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error("Google Auth Error:", error.message);
    };

    const signInWithFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error("Facebook Auth Error:", error.message);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signInWithGoogle, signInWithFacebook, signInWithEmail, signUpWithEmail, signOut }}>
            {!loading ? children : <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-blue-400">Loading Auth...</div>}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
