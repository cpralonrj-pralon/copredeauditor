import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <div className="h-screen flex items-center justify-center text-slate-500">Carregando...</div>;
    }

    // Must be logged in AND be an admin
    if (!user || !isAdmin) {
        // Redirect to dashboard (or login) if not authorized
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
