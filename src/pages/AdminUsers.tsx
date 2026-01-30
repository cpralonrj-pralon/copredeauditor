import { useState } from 'react';
import { UserPlus, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function AdminUsers() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('analyst');
    const [copied, setCopied] = useState(false);

    const generateSQL = () => {
        const email = `${login.trim().toLowerCase()}@claro.com.br`;

        return `-- Script para criar usuário: ${login}
DO $$
DECLARE
    v_user_id uuid;
    v_login text := '${login.trim().toUpperCase()}';
    v_email text := '${email}';
    v_password text := '${password}';
    v_role text := '${role}';
    v_existing_id uuid;
BEGIN
    SELECT id INTO v_existing_id FROM auth.users WHERE email = v_email;
    
    IF v_existing_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário existente encontrado: %, deletando...', v_email;
        DELETE FROM auth.identities WHERE user_id = v_existing_id;
        DELETE FROM auth.sessions WHERE user_id = v_existing_id;
        DELETE FROM auth.refresh_tokens WHERE user_id = v_existing_id;
        DELETE FROM public.profiles WHERE id = v_existing_id;
        DELETE FROM auth.users WHERE id = v_existing_id;
        RAISE NOTICE 'Usuário deletado com sucesso';
    END IF;

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(), 'authenticated', 'authenticated', v_email,
        crypt(v_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('login', v_login),
        now(), now(), '', ''
    ) RETURNING id INTO v_user_id;

    INSERT INTO public.profiles (id, login, role)
    VALUES (v_user_id, v_login, v_role)
    ON CONFLICT (id) DO UPDATE
    SET login = EXCLUDED.login, role = EXCLUDED.role;

    RAISE NOTICE 'Usuário % criado com sucesso! ID: %', v_login, v_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro: %', SQLERRM;
        RAISE;
END $$;`;
    };

    const handleCopySQL = () => {
        if (!login || !password) {
            alert('Preencha o Login e a Senha primeiro.');
            return;
        }

        const sql = generateSQL();
        navigator.clipboard.writeText(sql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-blue-600" />
                Gerenciar Usuários
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Adicionar Novo Usuário</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Login (ex: N123456)</label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                                placeholder="LOGIN"
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
                            onClick={handleCopySQL}
                            disabled={!login || !password}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                            {copied ? 'SQL Copiado!' : 'Copiar Script SQL'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 max-w-2xl">
                <p className="font-semibold flex items-center gap-2 text-blue-900 mb-3">
                    <Info size={18} />
                    Como Criar o Usuário
                </p>
                <ol className="text-sm text-blue-800 space-y-2 ml-6 list-decimal">
                    <li>Preencha o <strong>Login</strong> e a <strong>Senha</strong> acima</li>
                    <li>Clique em <strong>"Copiar Script SQL"</strong></li>
                    <li>Acesse o <strong>Supabase Dashboard → SQL Editor</strong></li>
                    <li>Cole e execute o script</li>
                    <li>Pronto! O usuário será criado sem te deslogar</li>
                </ol>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800 max-w-2xl">
                <p className="font-semibold flex items-center gap-2 mb-1">
                    <AlertCircle size={16} />
                    Importante
                </p>
                <p>
                    O sistema usa SQL direto no banco para evitar que você seja deslogado ao criar usuários.
                    Esta é a forma mais segura e confiável para administradores.
                </p>
            </div>
        </div>
    );
}
