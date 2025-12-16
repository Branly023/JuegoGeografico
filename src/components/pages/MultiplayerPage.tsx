import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import CreateJoinRoom from '../multiplayer/CreateJoinRoom';
import Lobby from '../multiplayer/Lobby';
import MultiplayerGame from '../multiplayer/MultiplayerGame';
import { useNavigate } from 'react-router-dom';

const MultiplayerPage: React.FC = () => {
    const { room } = useMultiplayer();
    const navigate = useNavigate();

    // If status is playing, we render the Game here
    if (room?.status === 'playing') {
        return <MultiplayerGame />;
    }

    return (
        <div className="min-h-screen bg-night bg-[url('/grid-pattern.svg')] relative overflow-hidden">
            {/* Background Effects (copied from Landing for consistency) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-europe/5 blur-[120px] rounded-full mix-blend-screen -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-americas/5 blur-[100px] rounded-full mix-blend-screen translate-y-1/3 -translate-x-1/3"></div>
            </div>

            <div className="relative z-10 pt-10">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-soft-gray hover:text-white flex items-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Volver
                </button>

                {room ? (
                    <Lobby />
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[80vh]">
                        <CreateJoinRoom onCancel={() => navigate('/')} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiplayerPage;
