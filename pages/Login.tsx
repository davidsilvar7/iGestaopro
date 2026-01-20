import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }
            // Auth state change will be picked up by App.tsx listener
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">iGestão Pro</h1>
                    <p className="text-slate-400">Entre para gerenciar seu negócio</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center text-red-200 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle size={16} className="mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-1">E-mail</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="text-slate-500" size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="text-slate-500" size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 animate-spin" size={20} />
                                Entrando...
                            </>
                        ) : (
                            <>
                                Entrar no Sistema
                                <ArrowRight className="ml-2" size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Esqueceu a senha? <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Recuperar acesso</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
