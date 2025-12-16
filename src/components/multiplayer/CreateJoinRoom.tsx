import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
    onCancel: () => void;
}

const CreateJoinRoom: React.FC<Props> = ({ onCancel }) => {
    const { createRoom, joinRoom, loading, error, invites, declineInvite } = useMultiplayer();
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');

    const handleCreate = async () => {
        await createRoom();
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.length < 6) return;
        await joinRoom(joinCode.toUpperCase());
    };

    const handleAcceptInvite = async (code: string, inviteId: string) => {
        const success = await joinRoom(code);
        if (success) {
            await declineInvite(inviteId); // Remove invite after joining
        }
    };

    if (!user) {
        return (
            <div className="text-center p-6">
                <p className="text-white mb-4">Debes iniciar sesión para jugar online.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="bg-white/10 text-white px-4 py-2 rounded-lg">Cerrar</button>
                    {/* Trigger login modal logic here if possible, but for now just show message */}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 text-white w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Multiplayer Lobby</h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="mb-6 space-y-2">
                    <h3 className="font-bold text-sm text-soft-gray uppercase tracking-wider mb-2">Invitaciones Pendientes</h3>
                    {invites.map((invite) => (
                        <div key={invite.id} className="bg-brand-asia/10 border border-brand-asia/30 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <div className="font-bold text-brand-asia text-sm">{invite.sender?.username || 'Usuario'}</div>
                                <div className="text-xs text-soft-gray">Sala: {invite.room?.room_code}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAcceptInvite(invite.room?.room_code, invite.id)}
                                    className="px-3 py-1 bg-brand-asia hover:bg-emerald-600 rounded text-xs font-bold"
                                >Aceptar</button>
                                <button
                                    onClick={() => declineInvite(invite.id)}
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-xs"
                                >✕</button>
                            </div>
                        </div>
                    ))}
                    <div className="w-full h-px bg-white/10 my-4"></div>
                </div>
            )}

            <div className="space-y-6">
                {/* Create Room */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="font-bold mb-2 text-brand-europe">Crear Sala</h3>
                    <p className="text-sm text-soft-gray mb-4">Inicia una nueva partida y sé el anfitrión.</p>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-brand-europe hover:bg-blue-600 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                    >
                        {loading ? 'Creando...' : 'Crear Sala'}
                    </button>
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">O</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* Join Room */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="font-bold mb-2 text-brand-asia">Unirse a Sala</h3>
                    <form onSubmit={handleJoin} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="CÓDIGO"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            maxLength={6}
                            className="bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-center tracking-widest font-mono uppercase flex-1 focus:outline-none focus:border-brand-asia"
                        />
                        <button
                            type="submit"
                            disabled={loading || joinCode.length < 6}
                            className="bg-brand-asia hover:bg-emerald-600 px-6 rounded-lg font-bold disabled:opacity-50 transition-all"
                        >
                            {loading ? '...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-6 text-center">
                <button onClick={onCancel} className="text-soft-gray hover:text-white text-sm">Cancelar</button>
            </div>
        </div>
    );
};

export default CreateJoinRoom;
