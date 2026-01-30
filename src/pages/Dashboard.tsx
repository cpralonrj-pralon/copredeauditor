import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import type { Incident } from '@/types';
import { DashboardCharts } from '@/components/DashboardCharts';

export function Dashboard() {
    const [stats, setStats] = useState({ total: 0, pending: 0, treated: 0 });
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Parallel requests: stats and full data
            // Fetching all data might be heavy in production, but needed for client-side aggregation charts
            // In a real app we might use RPC calls or specific group_by queries
            const [totalReq, pendingReq, treatedReq, dataReq] = await Promise.all([
                supabase.from('assertividade_incidentes').select('*', { count: 'exact', head: true }),
                supabase.from('assertividade_incidentes').select('*', { count: 'exact', head: true }).eq('status_audit', 'Pendente'),
                supabase.from('assertividade_incidentes').select('*', { count: 'exact', head: true }).eq('status_audit', 'Tratado'),
                supabase.from('assertividade_incidentes').select('*').order('created_at', { ascending: false })
            ]);

            setStats({
                total: totalReq.count || 0,
                pending: pendingReq.count || 0,
                treated: treatedReq.count || 0
            });

            if (dataReq.data) {
                setIncidents(dataReq.data as unknown as Incident[]);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Cards */}
                {[
                    { title: "Total de Incidentes", value: stats.total, sub: "Importados" },
                    { title: "Pendentes de Auditoria", value: stats.pending, sub: "Aguardando ação" },
                    { title: "Tratados", value: stats.treated, sub: "Finalizados" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{kpi.title}</h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-800">{kpi.value}</span>
                            <span className="text-sm text-slate-400">{kpi.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : (
                <DashboardCharts incidents={incidents} />
            )}
        </div>
    );
}
