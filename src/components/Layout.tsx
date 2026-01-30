import { useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, ListChecks, Menu, User, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Layout() {
    const location = useLocation();
    const { profile, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/audit', label: 'Auditoria', icon: ListChecks },
        { href: '/reports', label: 'Relatórios', icon: BarChart2 },
        { href: '/import', label: 'Importar Dados', icon: FileSpreadsheet },
    ];

    if (isAdmin) {
        navItems.push({ href: '/admin', label: 'Usuários', icon: User });
    }

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-slate-900 text-white transition-all duration-300 flex flex-col",
                    isSidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    {isSidebarOpen && <span className="font-bold text-lg tracking-tight">Portal Assertividade</span>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 py-6 space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-lg transition-colors group relative",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon size={20} className={cn("shrink-0", isSidebarOpen && "mr-3")} />
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                            <User size={16} />
                        </div>
                        {isSidebarOpen && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium truncate" title={profile?.login}>{profile?.login || 'Usuário'}</p>
                                <p className="text-xs text-slate-500 capitalize">{profile?.role || 'Visitante'}</p>
                            </div>
                        )}
                    </div>
                    {isSidebarOpen && (
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <LogOut size={14} />
                            Sair do Sistema
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <h1 className="text-xl font-semibold text-slate-800">
                        {navItems.find(i => i.href === location.pathname)?.label || 'Portal Assertividade'}
                    </h1>
                    <div className="flex items-center gap-4">
                        {/* Header actions can go here */}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
