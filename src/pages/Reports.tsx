import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { collaborators } from '@/data/collaborators';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserX, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import type { Incident } from '@/types';

export function Reports() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('assertividade_incidentes')
            .select('*')
            .eq('status_audit', 'Tratado');

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            setIncidents(data as unknown as Incident[]);
        }
        setLoading(false);
    };

    // KPIS
    const totalAuditados = incidents.length;
    const feedbackEnviados = incidents.filter(i => i.audit_feedback_enviado).length;
    const feedbackPercent = totalAuditados > 0 ? ((feedbackEnviados / totalAuditados) * 100).toFixed(1) : '0';

    // Ranking Logic
    const offenderMap: Record<string, { count: number, reasons: Record<string, number> }> = {};

    incidents.forEach(inc => {
        if (inc.audit_login_ofensor) {
            const login = inc.audit_login_ofensor.toUpperCase().trim();
            if (!offenderMap[login]) {
                offenderMap[login] = { count: 0, reasons: {} };
            }
            offenderMap[login].count++;

            const reason = inc.audit_motivo || 'Sem motivo';
            offenderMap[login].reasons[reason] = (offenderMap[login].reasons[reason] || 0) + 1;
        }
    });

    const ranking = Object.entries(offenderMap)
        .map(([login, data]) => {
            const collaborator = collaborators[login];
            return {
                login,
                name: collaborator ? collaborator.name : 'Desconhecido',
                email: collaborator ? collaborator.email : null,
                count: data.count,
                topReason: Object.entries(data.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

    // Reason Chart Data
    const reasonMap: Record<string, number> = {};
    incidents.forEach(inc => {
        if (inc.audit_motivo) {
            reasonMap[inc.audit_motivo] = (reasonMap[inc.audit_motivo] || 0) + 1;
        }
    });

    const chartData = Object.entries(reasonMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const handleSendEmail = (_: string, email: string | null) => {
        if (!email) return;
        window.open(`mailto:${email}?subject=Feedback%20de%20Qualidade&body=Ol%C3%A1%2C%0A%0AIdentificamos%20alguns%20pontos%20de%20aten%C3%A7%C3%A3o%20em%20seus%20atendimentos%20recentes.%20Por%20favor%2C%20procure%20seu%20supervisor%20para%20alinhamento.`, '_blank');
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Relatório de Performance</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Incidentes Tratados</p>
                        <p className="text-2xl font-bold text-slate-800">{totalAuditados}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Mail size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Feedbacks Enviados</p>
                        <p className="text-2xl font-bold text-slate-800">{feedbackEnviados} <span className="text-sm font-normal text-slate-400">({feedbackPercent}%)</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Ofensores Identificados</p>
                        <p className="text-2xl font-bold text-slate-800">{Object.keys(offenderMap).length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <UserX size={20} className="text-red-500" />
                            Top 10 Ofensores
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Rank</th>
                                    <th className="px-6 py-3">Colaborador</th>
                                    <th className="px-6 py-3 text-center">Erros</th>
                                    <th className="px-6 py-3">Motivo Principal</th>
                                    <th className="px-6 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ranking.map((item, index) => (
                                    <tr key={item.login} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-800">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.login}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                {item.count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 truncate max-w-[150px]" title={item.topReason}>
                                            {item.topReason}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.email && (
                                                <button
                                                    onClick={() => handleSendEmail(item.login, item.email)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={`Enviar e-mail para ${item.email}`}
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {ranking.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                            Nenhum dado de ofensor registrado ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Principais Motivos</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    interval={0}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
