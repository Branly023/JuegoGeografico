// ============================================
// Interfaces for Context Providers
// ============================================

// --- Auth Context Types ---
export interface UserProfile {
    id: string;
    username?: string;
    avatar_url?: string;
}

// --- Game Context Types ---
export type GameType = 'flag' | 'name';
export type Region = 'World' | 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania';
export type Language = 'en' | 'es';

export interface GameState {
    lives: number;
    score: number;
    targetCountry: import('../services/api').Country | null;
    gameState: 'loading' | 'playing' | 'won' | 'lost';
    countryStatus: Record<string, 'correct_1' | 'correct_2' | 'correct_3' | 'failed'>;
}

// --- Multiplayer Context Types ---
export interface Room {
    id: string;
    room_code: string;
    host_id: string;
    game_mode: string;
    status: 'waiting' | 'playing' | 'finished';
    max_players: number;
    created_at: string;
}

export interface Player {
    id: string;
    room_id: string;
    player_id: string;
    score: number;
    lives: number;
    is_ready: boolean;
    joined_at: string;
    profile?: {
        username: string;
        avatar_url: string;
    };
}

export interface MultiplayerGameState {
    id: string;
    room_id: string;
    current_turn: string;
    current_question: any;
    round: number;
    updated_at: string;
}

export interface GameMove {
    id: string;
    room_id: string;
    player_id: string;
    move_type: 'guess' | 'surrender' | 'all_failed';
    country_id?: string;
    is_correct?: boolean;
    round?: number;
    created_at: string;
}
