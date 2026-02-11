
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2, Globe, Brain, Puzzle, Swords, Flag, Type, Heart, Clock, Dices, Map, Languages, Ghost, Rocket, Trophy, ChevronRight
} from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import GameConfigModal from '../singleplayer/GameConfigModal';
import { type GameType, type Region } from '../../context/GameContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleSinglePlayerStart = (mode: GameType, region: Region) => {
        navigate('/play', { state: { mode, region } });
        setShowConfigModal(false);
    };

    return (
        <div className="min-h-screen bg-night text-white font-sans selection:bg-brand-europe/30 overflow-x-hidden">
            {/* 1. HERO SECTION */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-deep/80 z-0"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-europe/20 via-deep/50 to-night z-0"></div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <div className="mb-6 animate-in fade-in zoom-in duration-700">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-brand-europe text-sm font-bold tracking-wider mb-4">
                            GEO<span className="text-white">COMMAND</span> 2.0
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                            Domina la <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-europe via-brand-americas to-brand-asia">
                                Geografía Mundial
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-soft-gray mb-10 max-w-2xl mx-auto leading-relaxed">
                            Explora, compite y aprende con el juego de geografía más dinámico.
                            Reta a tus amigos o supera tus propios límites.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-brand-europe hover:bg-blue-600 text-white text-lg font-bold rounded-xl shadow-xl shadow-brand-europe/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Gamepad2 className="w-6 h-6" />
                            Single Player
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => navigate('/multiplayer')}
                            className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-bold rounded-xl border border-white/10 backdrop-blur-sm transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <Swords className="w-6 h-6" />
                            Multiplayer
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. STATS BAR */}
            <div className="w-full bg-deep/50 border-y border-white/5 py-8 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-americas/10 rounded-full flex items-center justify-center shrink-0">
                            <Brain className="w-6 h-6 text-brand-americas" />
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
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-wide flex items-center justify-center gap-3">
                        <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-brand-europe" />
                        Modos de Juego
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Single Player Card */}
                    <div
                        onClick={() => setShowConfigModal(true)}
                        className="group relative bg-deep/40 hover:bg-deep/60 border border-white/5 hover:border-brand-europe/30 rounded-3xl p-8 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-16 h-16 bg-brand-europe/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Puzzle className="w-8 h-8 text-brand-europe" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Single Player</h3>
                        <p className="text-soft-gray text-lg">Entrena a tu ritmo y mejora tus conocimientos geográficos.</p>

                        <div className="mt-6 border-t border-white/5 pt-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Globe className="w-6 h-6 text-brand-europe" />
                                    <div>
                                        <h4 className="font-bold text-white">Por continentes</h4>
                                        <p className="text-xs text-soft-gray">Enfócate en regiones específicas.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Flag className="w-6 h-6 text-brand-americas" />
                                    <div>
                                        <h4 className="font-bold text-white">Adivina el país por su bandera</h4>
                                        <p className="text-xs text-soft-gray">Identifica símbolos nacionales.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <Type className="w-6 h-6 text-brand-africa" />
                                    <div>
                                        <h4 className="font-bold text-white">Por nombre (español o inglés)</h4>
                                        <p className="text-xs text-soft-gray">Localiza países en el mapa.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-asia/5 border border-brand-asia/20">
                                    <Heart className="w-6 h-6 text-brand-asia fill-brand-asia/20" />
                                    <div>
                                        <h4 className="font-bold text-white">Modo con vidas</h4>
                                        <p className="text-xs text-brand-asia">Cada error cuenta. ¿Hasta dónde puedes llegar?</p>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                            <Swords className="w-8 h-8 text-brand-asia" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Multiplayer</h3>
                        <p className="text-soft-gray text-lg">Demuestra quién domina el mapa y reta a tus amigos en tiempo real.</p>

                        <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
                            <div className="p-6 rounded-2xl bg-deep/40 border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Swords className="w-5 h-5 text-red-500" />
                                    Deathmatch geográfico
                                </h3>
                                <p className="text-sm text-soft-gray">
                                    Eliminación directa. Si fallas, quedas fuera. El último en pie gana.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-deep/40 border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Modo puntos por banderas
                                </h3>
                                <p className="text-sm text-soft-gray">
                                    Compite por ver quién identifica más banderas en 2 minutos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* VARIETY SECTION */}
            <section className="py-24 bg-deep/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                            { icon: <Flag className="w-8 h-8 text-brand-europe" />, label: 'Banderas del mundo' },
                            { icon: <Globe className="w-8 h-8 text-brand-americas" />, label: 'Países y continentes' },
                            { icon: <Map className="w-8 h-8 text-brand-africa" />, label: 'Islas y mapas específicos' },
                            { icon: <Heart className="w-8 h-8 text-brand-asia" />, label: 'Con vidas o sin vidas' },
                            { icon: <Clock className="w-8 h-8 text-brand-oceania" />, label: 'Diferentes tiempos' },
                            { icon: <Dices className="w-8 h-8 text-purple-400" />, label: 'Cada partida es distinta' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center p-6 bg-night border border-white/5 rounded-2xl hover:border-brand-europe/30 transition-colors">
                                <span className="mb-3">{item.icon}</span>
                                <span className="font-bold text-soft-white text-sm text-center">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROADMAP / COMING SOON */}
            <section className="py-24 px-6 bg-night relative">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-brand-oceania font-bold tracking-widest uppercase text-sm mb-2 flex items-center justify-center gap-2">
                            <Rocket className="w-4 h-4" /> Próximamente
                        </span>
                        <h2 className="text-3xl font-black text-white">El mundo sigue girando</h2>
                        <p className="text-soft-gray mt-2">Estamos trabajando en nuevas formas de explorar.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5 flex flex-col items-center">
                            <Map className="w-8 h-8 text-brand-europe mb-2" />
                            <span className="text-sm font-bold text-white">Estados y provincias</span>
                        </div>
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5 flex flex-col items-center">
                            <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                            <span className="text-sm font-bold text-white">Rankings globales</span>
                        </div>
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5 flex flex-col items-center">
                            <Languages className="w-8 h-8 text-blue-400 mb-2" />
                            <span className="text-sm font-bold text-white">Más idiomas</span>
                        </div>
                        <div className="p-4 rounded-xl bg-deep/50 border border-white/5 flex flex-col items-center">
                            <Ghost className="w-8 h-8 text-purple-500 mb-2" />
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
