import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { audioService } from '../services/audio'; // Restored
import { RealtimeChannel } from '@supabase/supabase-js';
import { useGame } from './GameContext';

// Types matches DB schema approximately
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
    id: string; // usually a join table id, but we might verify
    room_id: string;
    player_id: string;
    score: number;
    lives: number;
    is_ready: boolean;
    joined_at: string;
    // We might join with profiles to get display names, handled in UI or separate fetch
    profile?: {
        username: string;
        avatar_url: string;
    };
}

export interface GameState {
    id: string;
    room_id: string;
    current_turn: string; // player_id
    current_question: any; // JSON or specific structure
    round: number;
    time_left: number;
    updated_at: string;
}

// New Interface for Game Moves
export interface GameMove {
    id: string;
    room_id: string;
    player_id: string;
    move_type: 'guess' | 'timeout' | 'surrender' | 'all_failed';
    country_id?: string;
    is_correct?: boolean;
    round?: number;
    created_at: string;
}

interface MultiplayerContextType {
    room: Room | null;
    players: Player[];
    gameState: GameState | null;
    gameMoves: GameMove[]; // New: Track all game moves
    loading: boolean;
    error: string | null;
    createRoom: (gameMode?: string) => Promise<string | null>; // returns room code
    joinRoom: (code: string) => Promise<boolean>;
    leaveRoom: () => Promise<void>;
    toggleReady: () => Promise<void>;
    startGame: (initialQuestion: any) => Promise<void>;
    submitAnswer: (params: { isCorrect: boolean, guessedCountry: string | null, nextQuestion?: any, isTimeout?: boolean, turnAtClick?: string }) => Promise<void>;
    sendInvite: (friendId: string) => Promise<void>;
    declineInvite: (inviteId: string) => Promise<void>;
    invites: any[];
    isHost: boolean;
    debugLogs: string[];
    addLog: (msg: string) => void;
    refreshPlayers: () => Promise<void>;
    // New: Country tracking for multiplayer
    guessedCountries: Record<string, 'correct' | 'failed'>;
    failedCountryAnimation: string | null; // Country code being animated
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { filteredCountries } = useGame(); // Access Country Data
    const [room, setRoom] = useState<Room | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomChannel, setRoomChannel] = useState<RealtimeChannel | null>(null);
    const [gameChannel, setGameChannel] = useState<RealtimeChannel | null>(null);
    const [movesChannel, setMovesChannel] = useState<RealtimeChannel | null>(null); // New Channel
    const [invites, setInvites] = useState<any[]>([]);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    // New: Track game moves and derived state
    const [gameMoves, setGameMoves] = useState<GameMove[]>([]);
    const [guessedCountries, setGuessedCountries] = useState<Record<string, 'correct' | 'failed'>>({});
    const [questionAttempts, setQuestionAttempts] = useState<Set<string>>(new Set()); // player_ids who attempted current question


    const [failedCountryAnimation, setFailedCountryAnimation] = useState<string | null>(null);

    // Audio Logic Refs
    const processedMovesRef = useRef<Set<string>>(new Set());
    const lastTimeRef = useRef<number>(0);

    // Ref to prevent double-submission (Infinite Loop Fix)
    const submittingRef = useRef(false);
    // Lock to prevent clicking again while waiting for Turn Change subscription
    const [changingTurn, setChangingTurn] = useState(false);

    // Reset lock when turn actually changes
    useEffect(() => {
        setChangingTurn(false);
    }, [gameState?.current_turn]);

    const addLog = useCallback((msg: string) => {
        const time = new Date().toLocaleTimeString();
        setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    }, []);

    // Recompute guessedCountries and questionAttempts whenever gameMoves or gameState changes
    useEffect(() => {
        if (!gameState) {
            setGuessedCountries({});
            setQuestionAttempts(new Set());
            return;
        }

        const newGuessedCountries: Record<string, 'correct' | 'failed'> = {};
        const currentAttempts = new Set<string>();

        // Sort moves by time to ensure correct order
        const sortedMoves = [...gameMoves].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        sortedMoves.forEach(move => {
            // Only consider moves for the current round/game logical session if needed
            // But actually we want ALL history for this game session to show colored map
            // The previous logic filtered by `move.round !== gameState.round` which might hide previous correct answers?
            // User requested: "Deriva TODO desde gameMoves" and "status[move.country_id] = 'correct'".
            // If we want to show ALL correct answers from previous rounds in THIS game, we should NOT filter by round
            // unless the game clears map every round (unlikely for "Risk"-style or "Complete the map").
            // Assuming we want to show progress:

            // Standard Guesses
            if (move.move_type === 'guess' && move.country_id) {
                if (move.is_correct) {
                    newGuessedCountries[move.country_id] = 'correct';
                } else {
                    // Track attempt for current round logic (who moved)
                    if (move.round === gameState.round) {
                        currentAttempts.add(move.player_id);
                    }
                }
            }

            // Timeouts
            else if (move.move_type === 'timeout') {
                if (move.round === gameState.round) {
                    currentAttempts.add(move.player_id);
                }
            }

            // All Failed (Persistent Fail State)
            else if (move.move_type === 'all_failed' && move.country_id) {
                newGuessedCountries[move.country_id] = 'failed';
            }
        });

        setGuessedCountries(newGuessedCountries);
        setQuestionAttempts(currentAttempts);

    }, [gameMoves, gameState?.round]); // Derived purely from moves and round

    const fetchPlayers = useCallback(async (roomId: string) => {
        addLog(`🔄 fetching players for ${roomId}...`);
        const { data, error } = await supabase.rpc('get_room_players', {
            p_room_id: roomId
        });

        if (error) {
            addLog(`❌ Error fetching players: ${error.message}`);
            return;
        }

        if (data) {
            // addLog(`✅ Players received: ${data.length}`);
            if (data.length > 0) {
                // Log raw data to verify the new RPC structure
                addLog(`👤 RPC Data [0]: ${JSON.stringify(data[0])}`);
            }

            // Map flat RPC result to application Player interface
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedPlayers = data.map((p: any) => ({
                id: p.id,
                room_id: p.room_id,
                player_id: p.player_id,
                score: p.score,
                lives: p.lives,
                is_ready: p.is_ready,
                joined_at: p.joined_at,
                profile: {
                    username: p.username || 'Sin Nombre',
                    avatar_url: p.avatar_url
                }
            }));
            setPlayers(mappedPlayers);
        }
    }, [addLog]);

    // 4. Lobby Subscription
    const subscribeToRoom = useCallback((roomId: string) => {
        addLog(`📡 Subscribing to room:${roomId}`);
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_players',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    addLog(`🔔 Lobby update: ${payload.eventType}`);
                    // fetchPlayers(roomId); // REMOVED to prevent loop

                    if (payload.eventType === 'INSERT') {
                        // Need to fetch profile for the new player
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('username, avatar_url')
                            .eq('id', payload.new.player_id)
                            .single();

                        setPlayers(prev => {
                            // Check if already exists to prevent duplicates
                            if (prev.find(p => p.id === payload.new.id)) return prev;

                            const newPlayer: Player = {
                                id: payload.new.id,
                                room_id: payload.new.room_id,
                                player_id: payload.new.player_id,
                                score: payload.new.score,
                                lives: payload.new.lives,
                                is_ready: payload.new.is_ready,
                                joined_at: payload.new.created_at || new Date().toISOString(),
                                profile: {
                                    username: profile?.username || 'Sin Nombre',
                                    avatar_url: profile?.avatar_url
                                }
                            };
                            return [...prev, newPlayer];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setPlayers(prev => prev.map(p => {
                            if (p.id === payload.new.id) {
                                // Merge new data but KEEP the profile
                                return {
                                    ...p,
                                    score: payload.new.score,
                                    lives: payload.new.lives,
                                    is_ready: payload.new.is_ready,
                                    // other fields if needed
                                };
                            }
                            return p;
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedPlayerId = payload.old.player_id;
                        addLog(`🚪 Player left: ${deletedPlayerId}`);

                        setPlayers(prev => {
                            const newPlayers = prev.filter(p => p.id !== payload.old.id);
                            return newPlayers;
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`
                },
                (payload) => {
                    console.log('Room update', payload);
                    setRoom(payload.new as Room);
                }
            )
            .subscribe((status) => {
                addLog(`📡 Room Channel Status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    // Only fetch once on subscribe if needed, but normally fetchPlayers is called before this
                    // We can leave it here or remove it if joinRoom calls it. 
                    // Logic: joinRoom calls fetchPlayers, then subscribe. 
                    // We might not need to call it here again to adhere strictly to "Snapshot once"
                    // But for safety against race conditions during connection, one check is okay?
                    // User said: "fetchInitialPlayers ... SOLO UNA VEZ".
                    // joinRoom already does it. Let's REMOVE it here to be safe and strict.
                }
            });

        setRoomChannel(channel);
    }, [addLog]);

    const isHost = room?.host_id === user?.id;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            roomChannel?.unsubscribe();
            gameChannel?.unsubscribe();
            movesChannel?.unsubscribe();
        };
    }, [roomChannel, gameChannel, movesChannel]);

    // 9. Invitations Subscription
    useEffect(() => {
        if (!user) return;

        // Fetch initial invites
        supabase.from('room_invites').select('*, room:rooms(room_code, game_mode), sender:profiles(username)')
            .eq('to_user', user.id)
            .then(({ data }) => {
                if (data) setInvites(data);
            });

        const channel = supabase
            .channel(`invites:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_invites',
                    filter: `to_user=eq.${user.id}`
                },
                async (payload) => {
                    console.log('Invite received', payload);
                    // Fetch full details
                    const { data } = await supabase.from('room_invites')
                        .select('*, room:rooms(room_code, game_mode), sender:profiles(username)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) setInvites(prev => [...prev, data]);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // 7. Game Subscription
    const subscribeToGame = useCallback((roomId: string) => {
        addLog(`🎮 Subscribing to game_state for room:${roomId}`);
        const channel = supabase
            .channel(`game:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT (start) and UPDATE (turns)
                    schema: 'public',
                    table: 'game_state',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    addLog(`🎲 Game state event: ${payload.eventType}`);
                    setGameState(payload.new as GameState);
                }
            )
            .subscribe();

        setGameChannel(channel);
    }, [addLog]);

    // New: Moves Subscription
    const subscribeToMoves = useCallback((roomId: string) => {
        addLog(`♟️ Subscribing to game_moves for room:${roomId}`);

        // Fetch existing moves first
        supabase.from('game_moves')
            .select('*')
            .eq('room_id', roomId)
            .then(({ data }) => {
                if (data) setGameMoves(data as GameMove[]);
            });

        const channel = supabase
            .channel(`moves:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_moves',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    addLog(`🆕 New Move: ${payload.new.move_type} by ${payload.new.player_id}`);
                    setGameMoves(prev => [...prev, payload.new as GameMove]);
                }
            )
            .subscribe();

        setMovesChannel(channel);
    }, [addLog]);


    // Safety: Fetch game state if room is playing but we don't have it (Refresh / Late join)
    useEffect(() => {
        if (room?.status === 'playing' && !gameState) {
            addLog(`⚠️ Room is playing but no game state. Fetching...`);
            supabase.from('game_state')
                .select('*')
                .eq('room_id', room.id)
                .single()
                .then(({ data, error }) => {
                    if (data) {
                        addLog(`✅ Game state fetched manually.`);
                        setGameState(data as GameState);
                    }
                    if (error) {
                        addLog(`❌ Error fetching game state: ${error.message}`);
                    }
                });
        }
    }, [room?.status, room?.id, gameState, addLog]);

    // 2. Create Room
    const createRoom = useCallback(async (gameMode: string = 'deathmatch') => {
        if (!user) return null;
        setLoading(true);
        setError(null);

        try {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: newRoom, error: roomError } = await supabase
                .from('rooms')
                .insert({
                    room_code: roomCode,
                    host_id: user.id,
                    game_mode: gameMode,
                    max_players: 6
                })
                .select()
                .single();

            if (roomError) throw roomError;

            const { error: playerError } = await supabase.from('room_players').insert({
                room_id: newRoom.id,
                player_id: user.id,
                is_ready: true // Host is always ready
            });

            if (playerError) throw playerError;

            setRoom(newRoom);
            await fetchPlayers(newRoom.id);
            subscribeToRoom(newRoom.id);
            subscribeToGame(newRoom.id);
            subscribeToMoves(newRoom.id);

            return roomCode;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user, fetchPlayers, subscribeToRoom, subscribeToGame, subscribeToMoves]);

    // 3. Join Room
    const joinRoom = useCallback(async (code: string) => {
        addLog(`🚪 Joining room ${code}...`);
        if (!user) {
            addLog(`❌ No user found for join.`);
            return false;
        }
        setLoading(true);
        setError(null);

        try {
            const { data: foundRoom, error: fetchError } = await supabase
                .from('rooms')
                .select('*')
                .eq('room_code', code)
                .single();

            if (fetchError || !foundRoom) throw new Error('Room not found');
            addLog(`🏠 Room found: ${foundRoom.id}`);

            const { data: existingPlayer } = await supabase
                .from('room_players')
                .select('*')
                .eq('room_id', foundRoom.id)
                .eq('player_id', user.id)
                .maybeSingle();

            if (existingPlayer) {
                addLog(`⚠️ Player already in room. Updating ready status...`);
                await supabase
                    .from('room_players')
                    .update({ is_ready: true })
                    .eq('room_id', foundRoom.id)
                    .eq('player_id', user.id);
            } else {
                addLog(`➕ Inserting player record...`);
                // ... (rest logic same)
                const { count } = await supabase
                    .from('room_players')
                    .select('*', { count: 'exact', head: true })
                    .eq('room_id', foundRoom.id);

                if (count && count >= (foundRoom.max_players || 6)) throw new Error('Room is full');

                const { error: joinError } = await supabase.from('room_players').insert({
                    room_id: foundRoom.id,
                    player_id: user.id,
                    is_ready: true
                });

                if (joinError) throw joinError;
            }

            setRoom(foundRoom);
            await fetchPlayers(foundRoom.id);
            subscribeToRoom(foundRoom.id);
            subscribeToGame(foundRoom.id);
            subscribeToMoves(foundRoom.id);

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, addLog, fetchPlayers, subscribeToRoom, subscribeToGame, subscribeToMoves]);

    const leaveRoom = useCallback(async () => {
        if (!user || !room) return;

        await supabase
            .from('room_players')
            .delete()
            .eq('room_id', room.id)
            .eq('player_id', user.id);

        setRoom(null);
        setPlayers([]);
        setGameState(null);
        setGameMoves([]);
        setGuessedCountries({});

        roomChannel?.unsubscribe();
        gameChannel?.unsubscribe();
        movesChannel?.unsubscribe();

        setRoomChannel(null);
        setGameChannel(null);
        setMovesChannel(null);
    }, [user, room, roomChannel, gameChannel, movesChannel]);

    // Check for "Last Man Standing" / Win Condition
    useEffect(() => {
        if (room?.status === 'playing' && players.length === 1 && !loading) {
            // Only one player left?
            const winner = players[0];
            addLog(`🏆 Game Over! Winner: ${winner.profile?.username}`);

            // Should we update DB? Or just show it? 
            // If the other player disconnected properly, DB room_players is updated.
            // We can set a local winner state or update room status.
            // Let's rely on UI to show "Waiting" or "Winner" based on this state.
            // But usually we want to explicit finish.

            if (isHost) { // Only one person triggers the update
                supabase.from('rooms')
                    .update({ status: 'finished' })
                    .eq('id', room.id)
                    .then(({ error }) => {
                        if (error) addLog(`❌ Error finishing game: ${error.message}`);
                    });
            }
        }
    }, [players.length, room?.status, isHost, loading, room?.id, addLog]);

    // Handle turn rotation when current turn player has left
    useEffect(() => {
        if (!gameState || !room || room.status !== 'playing') return;
        if (players.length === 0) return;

        // Check if current turn player still exists in the room
        const currentTurnExists = players.some(p => p.player_id === gameState.current_turn);

        if (!currentTurnExists && isHost) {
            addLog(`⚠️ Current turn player left! Rotating to next player...`);

            // Pick the first available player
            const nextPlayer = players[0];
            if (nextPlayer) {
                supabase.from('game_state')
                    .update({
                        current_turn: nextPlayer.player_id,
                        time_left: 15
                    })
                    .eq('room_id', room.id)
                    .then(({ error }) => {
                        if (error) {
                            addLog(`❌ Error rotating turn after player left: ${error.message}`);
                        } else {
                            addLog(`🔄 Turn rotated to ${nextPlayer.profile?.username} after player left`);
                        }
                    });
            }
        }
    }, [players, gameState?.current_turn, room?.status, room?.id, isHost, addLog]);

    // 5. Ready System
    const toggleReady = useCallback(async () => {
        if (!user || !room) return;

        const me = players.find(p => p.player_id === user.id);
        if (!me) {
            addLog('❌ Cannot toggle ready: Player not found in list');
            return;
        }

        addLog(`🔄 Toggling ready status to: ${!me.is_ready}`);

        const { error } = await supabase
            .from('room_players')
            .update({ is_ready: !me.is_ready })
            .eq('room_id', room.id)
            .eq('player_id', user.id);

        if (error) {
            addLog(`❌ Error toggling ready: ${error.message}`);
        }
    }, [user, room, players, addLog]);

    // 6. Start Game
    const startGame = useCallback(async (initialQuestion: any) => {
        addLog(`🎮 Attempting to start game...`);
        if (!user || !room) {
            addLog(`❌ Start failed: Missing user (${!!user}) or room (${!!room})`);
            return;
        }
        if (room.host_id !== user.id) {
            addLog(`❌ Start failed: User is not host`);
            return;
        }

        const allReady = players.every(p => p.is_ready);
        addLog(`👥 Players status: ${players.length} players. All Ready? ${allReady}. Details: ${JSON.stringify(players.map(p => ({ id: p.player_id, ready: p.is_ready })))}`);

        if (!allReady) {
            setError("Not all players are ready");
            addLog(`❌ Start failed: Not all players are ready`);
            return;
        }

        try {
            addLog(`📝 Updating room status to 'playing'...`);

            // 1. Reset Stats for ALL players
            const { error: statsError } = await supabase
                .from('room_players')
                .update({ lives: 3, score: 0 })
                .eq('room_id', room.id);

            if (statsError) {
                addLog(`❌ Error resetting stats: ${statsError.message}`);
                throw statsError;
            }

            // Clear old moves
            await supabase.from('game_moves').delete().eq('room_id', room.id);

            // Reset local game state for new game
            setGuessedCountries({});
            setQuestionAttempts(new Set());
            setFailedCountryAnimation(null);
            setGameMoves([]); // Clear local moves state

            const { error: roomError } = await supabase.from('rooms')
                .update({ status: 'playing' })
                .eq('id', room.id);

            if (roomError) {
                throw roomError;
            }

            // 2. Pick Random Start Player
            const randomPlayerIndex = Math.floor(Math.random() * players.length);
            const startPlayerId = players[randomPlayerIndex].player_id;
            addLog(`🎲 Random Start Player Selected: ${startPlayerId}`);

            addLog(`🎲 Inserting initial game state...`);
            const { error: gameError } = await supabase.from('game_state').insert({
                room_id: room.id,
                current_turn: startPlayerId,
                current_question: initialQuestion,
                round: 1,
                time_left: 15
            });

            if (gameError) {
                throw gameError;
            }

            addLog(`✅ Game started successfully!`);
        } catch (err: any) {
            setError(err.message);
            addLog(`❌ Error starting game: ${err.message}`);
        }
    }, [user, room, players, addLog]);




    // 8. Player Response
    // 8. Player Response
    const submitAnswer = useCallback(async ({
        isCorrect,
        guessedCountry,
        nextQuestion,
        isTimeout = false,
        turnAtClick
    }: {
        isCorrect: boolean;
        guessedCountry: string | null;
        nextQuestion?: any;
        isTimeout?: boolean;
        turnAtClick?: string;
    }) => {
        if (!user || !room || !gameState) return;

        // Prevent re-entry (Infinite Loop Fix) & Wait for subscription update
        if (submittingRef.current || changingTurn) {
            console.log("⏳ submitAnswer ignored: Already submitting or changing turn.", { submitting: submittingRef.current, changingTurn });
            return;
        }

        // Use turnAtClick if provided (from stable click event), otherwise fallback to current state (e.g. timeout)
        const turnToCheck = turnAtClick || gameState.current_turn;
        const isMe = user.id === turnToCheck;

        console.log(`🧪 submitAnswer payload`, {
            isTimeout,
            guessedCountry,
            currentCountryCode: gameState.current_question?.country,
            user: user.id,
            turn: gameState.current_turn,
            turnAtClick
        });
        console.log(`🚀 submitAnswer called. IsMe: ${isMe}, IsTimeout: ${isTimeout}, Guessed: ${guessedCountry}`);


        // If it's a timeout, the Host calls this. If it's a normal answer, only the turn player (user) calls.
        if (!isMe && !isTimeout) {
            addLog(`🛑 Ignored submitAnswer: Not my turn.`);
            return;
        }

        submittingRef.current = true; // LOCK
        setChangingTurn(true); // Persist lock until subscription updates

        const playerToUpdate = isTimeout ? gameState.current_turn : user.id;
        // Use the explicitly passed country, OR fall back to target if timeout (optional, usually timeout has no specific country guess)
        // actually for timeout we might want to log the target as the one "failed" or just leave it null?
        // User said: "El dato que clickeas Es el dato que insertas"
        // So we strictly use guessedCountry.
        // We still need currentCountryCode for the logic below (All Failed check)
        const currentCountryCode = gameState.current_question?.country;

        // Validation: If it's a guess (not timeout), we MUST have a guessedCountry
        if (!isTimeout && !guessedCountry) {
            addLog(`🛑 submitAnswer blocked: Missing guessedCountry for guess move.`);
            setChangingTurn(false);
            submittingRef.current = false;
            return;
        }

        const countryToInsert = isTimeout ? currentCountryCode : guessedCountry;


        try {
            const me = players.find(p => p.player_id === playerToUpdate);
            if (!me) {
                addLog(`❌ Player not found for score update`);
                return;
            }

            // 1. Log the Move in DB
            // 1. Log the Move in DB
            addLog(`📝 Inserting move for ${playerToUpdate}, code: ${countryToInsert}`);
            const { error: moveError } = await supabase.from('game_moves').insert({
                room_id: room.id,
                player_id: playerToUpdate,
                move_type: isTimeout ? 'timeout' : 'guess',
                country_id: countryToInsert,
                is_correct: isCorrect,
                round: gameState.round
            });

            if (moveError) {
                addLog(`❌ Insert Move Error: ${moveError.message} (Code: ${moveError.code}, Details: ${moveError.details})`);
                setChangingTurn(false); // Unlock immediately if insert fails, as turn won't rotate
                return; // Stop processing if insertion fails
            } else {
                addLog(`✅ Move Inserted successfully`);
            }

            // Filter active players (with lives > 0) for turn rotation
            const activePlayers = players.filter(p => p.lives > 0 || p.player_id === playerToUpdate);

            // 2. Update stats (Lives/Score) - Done by Host or User based on permissions
            // Since RLS was fixed, User can update their own score. Host can update anyone (for timeout).
            // WE USE RPC NOW TO BYPASS RLS FOR HOST UPDATING OTHERS
            if (isCorrect) {
                const { error } = await supabase.rpc('update_game_stats', {
                    p_room_id: room.id,
                    // p_player_id removed, uses auth.uid()
                    p_score_delta: 1000,
                    p_lives_delta: 0
                });
                if (error) addLog(`❌ Error updating score via RPC: ${error.message}`);

                // Rotate Turn & New Question
                const currentIndex = activePlayers.findIndex(p => p.player_id === gameState.current_turn);
                const nextIndex = (currentIndex + 1) % activePlayers.length;
                const nextPlayerId = activePlayers[nextIndex].player_id;
                const nextRound = gameState.round + (nextIndex === 0 ? 1 : 0);
                const nextCountryCode = nextQuestion ? nextQuestion.country : null;

                const { error: rotError } = await supabase.rpc('rotate_turn', {
                    p_room_id: room.id,
                    p_next_player_id: nextPlayerId,
                    p_next_round: nextRound,
                    p_next_country_code: nextCountryCode
                });

                if (rotError) {
                    addLog(`❌ Error rotating turn (RPC): ${rotError.message}`);
                } else {
                    addLog(`✅ Correct! Turn rotated to: ${nextPlayerId}`);
                }

            } else {
                // INCORRECT ANSWER or TIMEOUT: Lose life, track attempt
                const { error } = await supabase.rpc('update_game_stats', {
                    p_room_id: room.id,
                    // p_player_id removed
                    p_score_delta: 0,
                    p_lives_delta: -1
                });
                if (error) addLog(`❌ Error updating lives via RPC: ${error.message}`);

                // Track this player's attempt at current question (for immediate decision, state will update via useEffect)
                const newAttempts = new Set(questionAttempts); // Use the derived state
                newAttempts.add(playerToUpdate);

                // Check if ALL active players have now attempted this question
                const activePlayersFiltered = players.filter(p => p.lives > 0); // Need to re-filter here or trust activePlayers above
                const allPlayersAttempted = activePlayersFiltered.every(p => newAttempts.has(p.player_id));

                if (allPlayersAttempted && currentCountryCode) {
                    // ALL PLAYERS FAILED: JUST LOG IT. Listener handles the rest.
                    addLog(`💀 All players failed! Logging 'all_failed' move for ${currentCountryCode}`);

                    await supabase.from('game_moves').insert({
                        room_id: room.id,
                        player_id: user.id,
                        move_type: 'all_failed',
                        country_id: currentCountryCode,
                        is_correct: false,
                        round: gameState.round
                    });

                    // STOP HERE. No local animation. No local rotation.
                    // The 'gameMoves' listener below will catch this event.
                    setChangingTurn(false);
                    submittingRef.current = false;
                    return;
                } else {
                    // Not all players have attempted: SAME question, next player
                    const currentIndex = activePlayersFiltered.findIndex(p => p.player_id === gameState.current_turn);
                    const nextIndex = (currentIndex + 1) % activePlayersFiltered.length;
                    let nextPlayerId = activePlayersFiltered[nextIndex].player_id;

                    // Skip to next player who hasn't attempted yet
                    let rotations = 0;
                    let finalNextPlayerId = nextPlayerId;
                    let finalNextIndex = nextIndex;

                    while (newAttempts.has(finalNextPlayerId) && rotations < activePlayersFiltered.length) {
                        finalNextIndex = (finalNextIndex + 1) % activePlayersFiltered.length;
                        finalNextPlayerId = activePlayersFiltered[finalNextIndex].player_id;
                        rotations++;
                    }

                    // Local calculation for RPC


                    const { error: rotError } = await supabase.rpc('rotate_turn', {
                        p_room_id: room.id,
                        p_next_player_id: finalNextPlayerId,
                        p_next_round: gameState.round + (finalNextIndex === 0 && finalNextIndex !== currentIndex ? 1 : 0),
                        p_next_country_code: null // No new question on simple error
                    });

                    if (rotError) {
                        addLog(`❌ Error rotating turn (Fast): ${rotError.message}`);
                    } else {
                        addLog(`❌ Wrong! Fast Pass to: ${finalNextPlayerId}`);
                    }
                }
            }

        } catch (e: any) {
            addLog(`❌ Critical submit error: ${e.message}`);
            setChangingTurn(false); // Unlock on error
        } finally {
            submittingRef.current = false; // Release immediate execution lock
        }
    }, [user, room, gameState, players, questionAttempts, changingTurn, addLog]);

    // Timer Logic: Driven by the Current Turn Player
    // Because RLS prevents Host from updating game state if not their turn.


    // Sound Logic: Game Moves Listeners
    useEffect(() => {
        if (gameMoves.length === 0) return;

        // We only want to play sound for NEW moves arriving.
        const lastMove = gameMoves[gameMoves.length - 1];
        if (!processedMovesRef.current.has(lastMove.id)) {
            processedMovesRef.current.add(lastMove.id);

            // Only play if it's recent (prevent spam on reload)
            const isRecent = (new Date().getTime() - new Date(lastMove.created_at).getTime()) < 5000;
            if (isRecent) {
                if (lastMove.is_correct) {
                    audioService.playSuccess();
                } else {
                    audioService.playFailure();
                }

                // Trigger Animation & Rotation for All Failed
                if (lastMove.move_type === 'all_failed' && lastMove.country_id && lastMove.round === gameState?.round) {
                    // 1. Everyone shows animation
                    setFailedCountryAnimation(lastMove.country_id);

                    // 2. Turn Player handles rotation logic
                    const isMyTurn = user?.id === gameState?.current_turn;
                    // Note: If turn player left, host should probably pick this up, but keeping strict to user req "Solo jugador turno"

                    if (isMyTurn && room) {
                        setTimeout(async () => {
                            setFailedCountryAnimation(null); // Clean up local state strictly before rotation

                            // Pick Next Country (Frontend)
                            let nextCountryCode = null;
                            if (filteredCountries && filteredCountries.length > 0) {
                                // Simple random pick logic excluding previous
                                const available = filteredCountries.filter((c: any) => c.cca3 !== lastMove.country_id);
                                if (available.length > 0) {
                                    const rand = available[Math.floor(Math.random() * available.length)];
                                    nextCountryCode = rand.cca3;
                                }
                            }

                            // Calculate Next Player

                            // Validate state availability inside timeout
                            if (!gameState) return;

                            const activePlayers = players.filter(p => p.lives > 0);
                            const currentIndex = activePlayers.findIndex(p => p.player_id === gameState.current_turn);
                            const nextIndex = (currentIndex + 1) % activePlayers.length;
                            const nextPlayerId = activePlayers[nextIndex].player_id;
                            const nextRound = gameState.round + (nextIndex === 0 ? 1 : 0);

                            addLog(`🔄 All Failed Rotation -> Next: ${nextPlayerId}, Country: ${nextCountryCode}`);

                            await supabase.rpc('rotate_turn', {
                                p_room_id: room.id,
                                p_next_player_id: nextPlayerId,
                                p_next_round: nextRound,
                                p_next_country_code: nextCountryCode
                            });

                        }, 3000);
                    }
                }
            }
        }
    }, [gameMoves, gameState?.round, gameState?.current_turn, user?.id, filteredCountries, players, room]);


    // Send Invite
    const sendInvite = useCallback(async (friendId: string) => {
        if (!user || !room) return;
        await supabase.from('room_invites').insert({
            room_id: room.id,
            from_user: user.id,
            to_user: friendId
        });
    }, [user, room]);

    // Decline/Accept
    const declineInvite = useCallback(async (inviteId: string) => {
        await supabase.from('room_invites').delete().eq('id', inviteId);
        setInvites(prev => prev.filter(i => i.id !== inviteId));
    }, []);

    const refreshPlayers = useCallback(async () => {
        if (room?.id) await fetchPlayers(room.id);
    }, [room, fetchPlayers]);

    return (
        <MultiplayerContext.Provider value={{
            room, players, gameState, gameMoves, loading, error,
            createRoom, joinRoom, leaveRoom, toggleReady, startGame, submitAnswer, isHost,
            invites, sendInvite, declineInvite,
            debugLogs, addLog, refreshPlayers,
            guessedCountries, failedCountryAnimation
        }}>
            {children}
        </MultiplayerContext.Provider>
    );
};

export const useMultiplayer = () => {
    const context = useContext(MultiplayerContext);
    if (!context) {
        throw new Error('useMultiplayer must be used within a MultiplayerProvider');
    }
    return context;
};
