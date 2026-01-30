import { useState, useEffect } from 'react';
import type { Incident } from '@/types';
import { Eye, CheckCircle2, XCircle, Search, UserX, Repeat, MessageSquare } from 'lucide-react';
import { cn, formatExcelDate } from '@/lib/utils';
import { AuditModal } from './AuditModal';
import { supabase } from '@/lib/supabase';

export function IncidentTable() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [filter, setFilter] = useState('Todos'); // 'Todos', 'Pendente', 'Tratado'
    const [search, setSearch] = useState('');

    const [recurrenceMap, setRecurrenceMap] = useState<Record<string, number>>({});

    const fetchIncidents = async () => {
        setLoading(true);
        // Fetch last 100 incidents for now (paginate later if needed)
        const { data, error } = await supabase
            .from('assertividade_incidentes')
            .select('*')
            .eq('indicador_status', 'NÃO ADERENTE')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching incidents:', error);
        } else {
            const loadedIncidents = data as unknown as Incident[];
            setIncidents(loadedIncidents);

            // Calculate recurrence (Client-side for now, based on loaded data + potentially more if needed)
            // Ideally this should be a DB view, but for <1000 items client side is fine.
            // We'll just count how many times each (login + anomes) appears in the fetched list.
            // For a more robust solution, we'd need a separate query aggregating the whole DB.

            // Let's do a separate aggregate query for the relevant months/logins if possible, 
            // but for now, let's map what we have.
            const counts: Record<string, number> = {};
            loadedIncidents.forEach(inc => {
                if (inc.audit_login_ofensor && inc.anomes) {
                    const key = `${inc.audit_login_ofensor}-${inc.anomes}`;
                    counts[key] = (counts[key] || 0) + 1;
                }
            });
            setRecurrenceMap(counts);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const handleAudit = async (id: string, data: { status: 'Tratado', corrigido: boolean, motivo: string, loginOfensor?: string, feedbackEnviado?: boolean, evidenciaUrl?: string | null }) => {
        // Optimistic update
        setIncidents(prev => prev.map(inc =>
            inc.id === id ? {
                ...inc,
                status_audit: 'Tratado',
                audit_corrigido: data.corrigido,
                audit_motivo: data.motivo,
                audit_login_ofensor: data.loginOfensor,
                audit_feedback_enviado: data.feedbackEnviado,
                audit_evidencia_url: data.evidenciaUrl || undefined,
                audit_updated_at: new Date().toISOString(),
                audit_login: 'User'
            } : inc
        ));

        const { error } = await supabase
            .from('assertividade_incidentes')
            .update({
                status_audit: 'Tratado',
                audit_corrigido: data.corrigido,
                audit_motivo: data.motivo,
                audit_login_ofensor: data.loginOfensor,
                audit_feedback_enviado: data.feedbackEnviado,
                audit_evidencia_url: data.evidenciaUrl,
                audit_updated_at: new Date().toISOString(),
                audit_login: 'Usuario Atual', // Replace with real auth user if available
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating incident:', error);
            alert('Erro ao salvar no banco de dados: ' + error.message);
            fetchIncidents();
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        const matchesFilter = filter === 'Todos' || (inc.status_audit || 'Pendente') === filter;
        const matchesSearch = !search ||
            inc.id_mostra?.toLowerCase().includes(search.toLowerCase()) ||
            inc.indicador?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800">Lista de Incidentes</h2>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ID ou Indicador..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none focus:border-blue-500"
                    >
                        <option value="Todos">Todos</option>
                        <option value="Pendente">Pendentes</option>
                        <option value="Tratado">Tratados</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                {/* <th className="px-6 py-4">ID Mostra</th> Removed to save space if desired, or keep */}
                                <th className="px-6 py-4">ID Mostra</th>
                                <th className="px-6 py-4">Indicador</th>
                                <th className="px-6 py-4">Grupo</th>
                                <th className="px-6 py-4">Tecnologia</th>
                                <th className="px-6 py-4">Serviço</th>
                                <th className="px-6 py-4">Sintoma</th>

                                <th className="px-6 py-4">Data Início</th>
                                <th className="px-6 py-4">Auditoria</th>
                                <th className="px-6 py-4 w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                                            Carregando incidentes...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        Nenhum incidente encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredIncidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                incident.status_audit === 'Tratado'
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            )}>
                                                {incident.status_audit || 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{incident.id_mostra}</td>
                                        <td className="px-6 py-4 text-slate-600">{incident.indicador}</td>
                                        <td className="px-6 py-4 text-slate-600">{incident.in_grupo}</td>
                                        <td className="px-6 py-4 text-slate-600">{incident.tecnologia}</td>
                                        <td className="px-6 py-4 text-slate-600">{incident.servico}</td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={incident.sintoma}>{incident.sintoma}</td>

                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{formatExcelDate(incident.dt_inicio)}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {incident.status_audit === 'Tratado' && (
                                                <div className="flex items-center gap-1.5" title={incident.audit_motivo}>
                                                    {incident.audit_corrigido ? (
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                    ) : (
                                                        <XCircle size={16} className="text-red-500" />
                                                    )}
                                                    <span className="text-xs truncate max-w-[150px]">{incident.audit_motivo}</span>
                                                    {incident.audit_login_ofensor && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-100 rounded text-[10px] font-semibold text-red-700 ml-1" title={`Ofensor: ${incident.audit_login_ofensor}`}>
                                                            <UserX size={10} />
                                                            {incident.audit_login_ofensor}
                                                            {(recurrenceMap[`${incident.audit_login_ofensor}-${incident.anomes}`] || 0) > 1 && (
                                                                <span className="flex items-center gap-0.5 ml-1 px-1 py-0.5 bg-red-100 text-red-800 rounded text-[9px]" title="Reincidente no mês">
                                                                    <Repeat size={8} />
                                                                    {recurrenceMap[`${incident.audit_login_ofensor}-${incident.anomes}`]}x
                                                                </span>
                                                            )}
                                                            {incident.audit_feedback_enviado && (
                                                                <span className="flex items-center gap-0.5 ml-1 px-1 py-0.5 bg-green-100 text-green-800 rounded text-[9px]" title="Feedback Enviado">
                                                                    <MessageSquare size={8} />
                                                                    Feedback
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {incident.audit_evidencia_url && (
                                                        <a
                                                            href={incident.audit_evidencia_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-700 underline text-xs ml-1"
                                                            title="Ver Evidência"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            (Foto)
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedIncident(incident)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 p-2 rounded-lg hover:bg-blue-50"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedIncident && (
                <AuditModal
                    incident={selectedIncident}
                    isOpen={!!selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onSave={handleAudit}
                />
            )}
        </div>
    );
}
