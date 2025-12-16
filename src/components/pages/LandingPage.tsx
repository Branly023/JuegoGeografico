import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame, type GameType, type Region } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import UserMenu from '../layout/UserMenu';
import AuthModal from '../auth/AuthModal';
import GameConfigModal from '../singleplayer/GameConfigModal';

const LandingPage = () => {
    const navigate = useNavigate();
    const { startGame } = useGame();
    const { user } = useAuth();

    // Modals State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);

    const handleSinglePlayerStart = (mode: GameType, region: Region) => {
        startGame({ mode, region });
        navigate('/play');
    };

    return (
        <div className="relative w-full min-h-screen bg-night text-soft-white font-sans overflow-x-hidden">
            {/* Global Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-europe/5 blur-[120px] rounded-full mix-blend-screen -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-americas/5 blur-[100px] rounded-full mix-blend-screen translate-y-1/3 -translate-x-1/3"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-europe to-brand-americas flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white hidden sm:block">GEO<span className="text-brand-europe">COMMAND</span></span>
                </div>

                <div className="">
                    {user ? (
                        <UserMenu />
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="bg-deep hover:bg-slate-800 border border-white/10 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-brand-europe/20 hover:border-brand-europe/30"
                        >
                            Iniciar Sesión
                        </button>
                    )}
                </div>
            </nav>

            {/* 1. HERO / PORTADA */}
            <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">


                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-soft-white to-soft-gray drop-shadow-2xl">
                    Domina el mapa <br /> del mundo
                </h1>

                <p className="text-lg md:text-xl text-soft-gray max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                    Aprende geografía jugando solo o compite con amigos en tiempo real.
                    <span className="block mt-1 text-white font-medium">Rápido, competitivo y adictivo.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => setShowConfigModal(true)}
                        className="w-full sm:w-auto px-8 py-4 bg-brand-europe hover:bg-blue-600 text-white text-lg font-bold rounded-xl shadow-xl shadow-brand-europe/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                    >
                        🎮 Single Player
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            </section>

            {/* 2. ENGANCHE RÁPIDO (Quick Hook) */}
            <div className="w-full bg-deep/50 border-y border-white/5 py-8 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-americas/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-2xl">🧠</span>
                        </div>
                        <div>
                            <p className="font-bold text-white text-lg">¿Cuánto sabes realmente?</p>
                            <p className="text-sm text-soft-gray">Pon a prueba tu memoria en segundos.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MODOS DE JUEGO (General Overview) */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-wide">🎮 Modos de Juego</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Single Player Card */}
                    <div
                        onClick={() => setShowConfigModal(true)}
                        className="group relative bg-deep/40 hover:bg-deep/60 border border-white/5 hover:border-brand-europe/30 rounded-3xl p-8 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-16 h-16 bg-brand-europe/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="text-4xl">🧩</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Single Player</h3>
                        <p className="text-soft-gray text-lg">Entrena a tu ritmo y mejora tus conocimientos geográficos.</p>
                    </div>

                    {/* Multiplayer Card */}
                    <div
                        onClick={() => navigate('/multiplayer')}
                        className="group relative bg-deep/40 hover:bg-deep/60 border border-white/5 hover:border-brand-asia/30 rounded-3xl p-8 transition-all duration-300 cursor-pointer"
                    >
                        <div className="absolute top-4 right-4 px-2 py-1 bg-brand-asia/20 text-brand-asia text-[10px] font-bold uppercase rounded border border-brand-asia/20">
                            BETA
                        </div>
                        <div className="w-16 h-16 bg-brand-asia/10 rounded-2xl flex items-center justify-center mb-6">
                            <span className="text-4xl">⚔️</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Multiplayer</h3>
                        <p className="text-soft-gray text-lg">Demuestra quién domina el mapa y reta a tus amigos en tiempo real.</p>
                    </div>
                </div>
            </section>

            {/* 4. SINGLE PLAYER - DETALLE */}
            <section className="relative z-10 bg-deep/20 py-24 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-block px-3 py-1 rounded bg-brand-europe/10 text-brand-europe font-bold text-xs uppercase mb-4">
                            🌍 Single Player
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            Entrena tu conocimiento geográfico
                        </h2>
                        <p className="text-lg text-soft-gray mb-8 leading-relaxed">
                            Mejora tu memoria visual y tu velocidad identificando países, banderas y nombres alrededor del mundo.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-2xl">🌍</span>
                                <div>
                                    <h4 className="font-bold text-white">Por continentes</h4>
                                    <p className="text-xs text-soft-gray">Enfócate en regiones específicas.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-2xl">🏳️</span>
                                <div>
                                    <h4 className="font-bold text-white">Adivina el país por su bandera</h4>
                                    <p className="text-xs text-soft-gray">Identifica símbolos nacionales.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-2xl">🔤</span>
                                <div>
                                    <h4 className="font-bold text-white">Por nombre (español o inglés)</h4>
                                    <p className="text-xs text-soft-gray">Localiza países en el mapa.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-asia/5 border border-brand-asia/20">
                                <span className="text-2xl">❤️</span>
                                <div>
                                    <h4 className="font-bold text-white">Modo con vidas</h4>
                                    <p className="text-xs text-brand-asia">Cada error cuenta. ¿Hasta dónde puedes llegar?</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={() => setShowConfigModal(true)}
                                className="px-6 py-3 bg-white/10 hover:bg-brand-europe hover:text-white border border-white/10 rounded-lg font-bold transition-all"
                            >
                                Jugar Single Player
                            </button>
                        </div>
                    </div>
                    {/* Visual/Image Placeholder */}
                    <div className="flex-1 relative">
                        <div className="aspect-square rounded-full bg-gradient-to-br from-brand-europe/20 to-brand-americas/5 blur-3xl absolute inset-0"></div>
                        <div className="relative bg-deep/80 border border-white/10 rounded-2xl p-6 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-500">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="h-24 bg-brand-europe/20 rounded-lg animate-pulse"></div>
                                <div className="h-24 bg-brand-americas/20 rounded-lg"></div>
                                <div className="h-24 bg-brand-africa/20 rounded-lg"></div>
                                <div className="h-24 bg-brand-asia/20 rounded-lg"></div>
                            </div>
                            <div className="text-center font-mono text-xs text-soft-gray mt-2">SYSTEM: TRAINING MODE_ACTIVE</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. MULTIPLAYER - DETALLE */}
            <section className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-block px-3 py-1 rounded bg-brand-asia/10 text-brand-asia font-bold text-xs uppercase mb-4">
                            ⚔️ Multiplayer
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            La geografía también es competitiva
                        </h2>
                        <p className="text-lg text-soft-gray mb-8 leading-relaxed">
                            Crea una sala, invita hasta 5 amigos y compite en partidas rápidas llenas de tensión y estrategia.
                        </p>

                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-deep/40 border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    🔥 Deathmatch geográfico
                                </h3>
                                <p className="text-soft-gray text-sm mb-4">El mapa decide quién sobrevive.</p>
                                <ul className="text-sm space-y-2 text-soft-gray/80">
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-asia"></span>Turnos por jugador</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-asia"></span>País o isla aleatoria</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-asia"></span>Tiempo límite</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-asia"></span>Fallas → pierdes vidas</li>
                                    <li className="flex items-center gap-2 font-bold text-white"><span className="w-1.5 h-1.5 rounded-full bg-brand-asia"></span>Último en pie gana</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-2xl bg-deep/40 border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    🏆 Modo puntos por banderas
                                </h3>
                                <p className="text-soft-gray text-sm mb-4">Responde rápido, suma puntos y gana la partida.</p>
                                <ul className="text-sm space-y-2 text-soft-gray/80">
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-europe"></span>Banderas aleatorias</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-europe"></span>Puntuación acumulativa</li>
                                    <li className="flex items-center gap-2 font-bold text-white"><span className="w-1.5 h-1.5 rounded-full bg-brand-europe"></span>El más preciso gana</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    {/* Visual Placeholder */}
                    <div className="flex-1">
                        <div className="relative bg-deep/30 border border-white/5 rounded-3xl p-8 aspect-square flex items-center justify-center">
                            <div className="text-center opacity-50">
                                <span className="text-6xl block mb-4">⚔️</span>
                                <span className="font-mono text-sm tracking-widest">MULTIPLAYER_LOBBY_PREVIEW</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. VARIEDAD Y REJUGABILIDAD (Modos Destacados) */}
            <section className="relative z-10 bg-deep/20 py-24 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-black text-white mb-12 uppercase tracking-widest">🎯 Variedad y Rejugabilidad</h2>
                </div>
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                        { icon: '🏳️', label: 'Banderas del mundo' },
                        { icon: '🌍', label: 'Países y continentes' },
                        { icon: '🗺️', label: 'Islas y mapas específicos' },
                        { icon: '❤️', label: 'Con vidas o sin vidas' },
                        { icon: '⏱️', label: 'Diferentes tiempos' },
                        { icon: '🎲', label: 'Cada partida es distinta' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center p-6 bg-night border border-white/5 rounded-2xl hover:border-brand-europe/30 transition-colors">
                            <span className="text-3xl mb-3">{item.icon}</span>
                            <span className="font-bold text-soft-white text-sm text-center">{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. APRENDE JUGANDO */}
            <div className="border-b border-white/5 py-12 bg-deep/10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-lg font-bold text-brand-americas mb-4 uppercase">🧠 Aprende Jugando</h3>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-soft-gray text-sm md:text-base">
                        <span className="flex items-center gap-2">✅ Mejora tu memoria visual</span>
                        <span className="flex items-center gap-2">✅ Aprende nombres y ubicaciones reales</span>
                        <span className="flex items-center gap-2">✅ Aumenta tu velocidad de reacción</span>
                        <span className="flex items-center gap-2 font-medium text-white">✅ Compite sin darte cuenta de que estás aprendiendo</span>
                    </div>
                </div>
            </div>

            {/* 8. ROADMAP */}
            <section className="bg-night relative overflow-hidden py-24">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <span className="text-brand-oceania font-bold tracking-widest uppercase text-sm mb-2 block">🚀 Próximamente</span>
                    <h2 className="text-3xl font-black text-white mb-10">El mundo no termina aquí.</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5">
                            <span className="block text-2xl mb-2">🗺️</span>
                            <span className="text-sm font-bold text-white">Estados y provincias</span>
                        </div>
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5">
                            <span className="block text-2xl mb-2">🏆</span>
                            <span className="text-sm font-bold text-white">Rankings globales</span>
                        </div>
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5">
                            <span className="block text-2xl mb-2">🗣️</span>
                            <span className="text-sm font-bold text-white">Más idiomas</span>
                        </div>
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5">
                            <span className="block text-2xl mb-2">👾</span>
                            <span className="text-sm font-bold text-white">Nuevos modos</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. CTA FINAL */}
            <section className="py-24 px-6 text-center relative z-10">
                <div className="max-w-3xl mx-auto bg-gradient-to-b from-deep to-night border border-white/10 rounded-[2rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                    {/* Decorative Gradients */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-europe via-brand-americas to-brand-asia"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-europe/20 blur-[80px] rounded-full pointer-events-none"></div>

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-10">¿Listo para conquistar el mapa?</h2>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="px-8 py-4 bg-brand-europe hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-europe/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            🎮 Jugar en solitario
                        </button>
                        <button
                            onClick={() => navigate('/multiplayer')}
                            className="px-8 py-4 bg-deep hover:bg-slate-800 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            ⚔️ Jugar con amigos
                        </button>
                    </div>
                </div>
            </section>

            {/* 10. FOOTER */}
            <footer className="border-t border-white/5 bg-deep/30 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center relative">
                    <span className="font-bold text-lg text-white font-mono tracking-tight block mb-4">GEO<span className="text-brand-europe">COMMAND</span></span>

                    <div className="text-soft-gray mb-6 text-sm">
                        <p>Hecho para aprender, competir y divertirse.</p>
                        <p>El mundo está en tus manos.</p>
                    </div>

                    <div className="flex justify-center gap-6 text-xs text-slate-500">
                        <span>© 2025 GeoCommand</span>
                    </div>
                </div>
            </footer>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <GameConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} onStart={handleSinglePlayerStart} />
        </div>
    );
};

export default LandingPage;
