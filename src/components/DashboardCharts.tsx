import { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import type { Incident } from '@/types';

// Modern Palette
const COLORS = {
    primary: '#6366f1', // Indigo 500
    secondary: '#10b981', // Emerald 500
    accent: '#f59e0b', // Amber 500
    danger: '#ef4444', // Red 500
    info: '#3b82f6', // Blue 500
    purple: '#8b5cf6', // Violet 500
    slate: '#64748b', // Slate 500
    grid: '#f1f5f9', // Slate 100
};

const PIE_COLORS = ['#10b981', '#f43f5e']; // Green/Red for Corrected/Not

interface DashboardChartsProps {
    incidents: Incident[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200 p-3 rounded-xl shadow-lg text-sm">
                <p className="font-semibold text-slate-700 mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-slate-600">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: <span className="font-medium text-slate-900">{entry.value}</span></span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function DashboardCharts({ incidents }: DashboardChartsProps) {

    // 1. Corrections per Day (Area Chart with Gradient)
    const correctionsData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            if (inc.status_audit === 'Tratado' && inc.audit_updated_at) {
                const date = new Date(inc.audit_updated_at).toLocaleDateString('pt-BR');
                counts[date] = (counts[date] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => {
                const [d1, m1, y1] = a.date.split('/').map(Number);
                const [d2, m2, y2] = b.date.split('/').map(Number);
                return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
            });
    }, [incidents]);

    // 2. Top Login Offenders
    const offendersData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            if (inc.status_audit === 'Tratado' && inc.audit_login_ofensor) {
                const login = inc.audit_login_ofensor.toUpperCase();
                counts[login] = (counts[login] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([login, count]) => ({ login, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [incidents]);

    // 3. Monthly Volume
    const monthlyData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            if (inc.anomes) {
                counts[inc.anomes] = (counts[inc.anomes] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([anomes, count]) => ({ anomes: String(anomes), count }))
            .sort((a, b) => a.anomes.localeCompare(b.anomes));
    }, [incidents]);

    // 4. Status Distribution
    const statusData = useMemo(() => {
        let sim = 0;
        let nao = 0;
        incidents.forEach(inc => {
            if (inc.status_audit === 'Tratado') {
                if (inc.audit_corrigido) sim++;
                else nao++;
            }
        });
        return [
            { name: 'Corrigido', value: sim },
            { name: 'Não Corrigido', value: nao }
        ].filter(d => d.value > 0);
    }, [incidents]);

    // 5. Top Groups
    const groupsData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            if (inc.in_grupo) {
                const group = inc.in_grupo.trim().toUpperCase();
                counts[group] = (counts[group] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [incidents]);

    // 6. Top Symptoms
    const symptomsData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            if (inc.sintoma) {
                let symptom = inc.sintoma.trim().toUpperCase();
                if (symptom.length > 20) symptom = symptom.substring(0, 20) + '...';
                counts[symptom] = (counts[symptom] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [incidents]);

    // 7. Tools Distribution
    const toolsData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            if (inc.ferramenta_abertura) {
                const tool = inc.ferramenta_abertura.trim().toUpperCase();
                counts[tool] = (counts[tool] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [incidents]);

    // 8. Solution Pareto
    const solutionParetoData = useMemo(() => {
        const counts: Record<string, number> = {};
        let total = 0;

        incidents.forEach(inc => {
            if (inc.status_audit === 'Tratado' && inc.audit_corrigido === true && inc.solucao) {
                let sol = inc.solucao.trim().toUpperCase();
                if (sol.length > 30) sol = sol.substring(0, 30) + '...';
                counts[sol] = (counts[sol] || 0) + 1;
                total++;
            }
        });

        if (total === 0) return [];

        const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        let accumulated = 0;
        return sorted.map(item => {
            accumulated += item.count;
            return {
                ...item,
                cumulativePercentage: Math.round((accumulated / total) * 100)
            };
        }).slice(0, 10);
    }, [incidents]);


    if (incidents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p>Nenhum dado disponível para visualização.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-12">
            {/* Gradients Definition */}
            <svg style={{ height: 0 }}>
                <defs>
                    <linearGradient id="colorCorrections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                </defs>
            </svg>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Corrections per Day (Area Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Evolução Diária de Correções</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={correctionsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis dataKey="date" fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} dy={10} />
                                <YAxis fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorCorrections)" name="Correções" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Top Offenders (Rounded Bars) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Top Ofensores</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={offendersData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
                                <XAxis type="number" fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <YAxis dataKey="login" type="category" width={80} fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill={COLORS.danger} radius={[0, 4, 4, 0]} barSize={24} name="Incidentes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Monthly Volume */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Volume Mensal</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis dataKey="anomes" fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} dy={10} />
                                <YAxis fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill={COLORS.purple} radius={[6, 6, 0, 0]} barSize={40} name="Total" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Status Distribution (Donut Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Taxa de Correção</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={6}
                                >
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Top Groups */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Top Grupos</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
                                <XAxis type="number" fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" width={80} fontSize={10} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={24} name="Incidentes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Top Symptoms */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Principais Sintomas</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={symptomsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis dataKey="name" fontSize={10} stroke={COLORS.slate} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                                <YAxis fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill={COLORS.info} radius={[4, 4, 0, 0]} barSize={40} name="Ocorrências" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 7. Tools Distribution - Full Width */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Ferramenta de Abertura</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={toolsData} margin={{ bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                            <XAxis
                                dataKey="name"
                                fontSize={11}
                                stroke={COLORS.slate}
                                angle={-25}
                                textAnchor="end"
                                interval={0}
                                height={60}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={50} name="Volume" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 8. Solution Pareto */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Pareto de Soluções (Apenas Corrigidos)</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={solutionParetoData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                            <XAxis dataKey="name" fontSize={11} stroke={COLORS.slate} angle={-15} textAnchor="end" height={60} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={(tick) => `${tick}%`} fontSize={11} stroke={COLORS.slate} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Bar yAxisId="left" dataKey="count" fill={COLORS.secondary} barSize={40} radius={[6, 6, 0, 0]} name="Quantidade" />
                            <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke={COLORS.danger} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} name="Acumulado %" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
