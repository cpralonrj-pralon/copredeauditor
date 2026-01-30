import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Save, AlertCircle, CheckCircle } from 'lucide-react';

export function AdminUsers() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('analyst');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Você precisa estar logado para criar usuários.');
            }

            // Call Edge Function to create user (no auto-login)
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    login: login.trim(),
                    password,
                    role,
                },
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Erro ao criar usuário');
            }

            setMessage({ type: 'success', text: data.message });
            setLogin('');
            setPassword('');

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: err.message || 'Erro ao criar usuário.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-blue-600" />
                Gerenciar Usuários
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Adicionar Novo Usuário</h3>

                {message && (
                    <div className={`p-4 mb-4 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Login (ex: N123456)</label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                                placeholder="LOGIN"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Senha</label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Senha inicial"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Perfil</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="analyst"
                                    checked={role === 'analyst'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Analista (Padrão)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={role === 'admin'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Administrador</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    Observação Importante
                </p>
                <p className="mt-1">
                    Para que o cadastro funcione, a opção "Enable Email Signup" deve estar ativada no Supabase.
                    <br />
                    O sistema cuidará do resto. O usuário acessará apenas com o <strong>LOGIN</strong> e a senha definida.
                </p>
            </div>
        </div>
    );
}
