import React, { useState, useEffect } from 'react';
import { Users, Target, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabase';

const CrmDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalLeads: 0,
        newLeads: 0,
        activeNegotiations: 0,
        conversionRate: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // Real CRM Statistics
        const { count: leadCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('lifecycle_stage', 'LEAD');

        const { count: newLeadsCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('lifecycle_stage', 'LEAD')
            .eq('status', 'NEW');

        const { count: clientCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('lifecycle_stage', 'CLIENT');

        // Calculate simple conversion rate (Clients / Total Contacts) if needed, 
        // or just won leads / total leads. Hard to track "won leads" historically if they change stage.
        // For MVP, we'll show Clients count as "Conversions"

        setStats({
            totalLeads: leadCount || 0,
            newLeads: newLeadsCount || 0,
            activeNegotiations: 0, // Need complex query for this
            conversionRate: clientCount || 0 // Reusing this field to show Total Clients
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">CRM - Visão Geral</h1>
                <p className="text-slate-500">Gestão de relacionamento com clientes e leads</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total de Leads"
                    value={stats.totalLeads.toString()}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Novos Leads"
                    value={stats.newLeads.toString()}
                    icon={Target}
                    color="green"
                    subtext="Últimos 7 dias"
                />
                <StatCard
                    title="Em Negociação"
                    value={stats.activeNegotiations.toString()}
                    icon={TrendingUp}
                    color="purple"
                />
                <StatCard
                    title="Clientes Ativos"
                    value={stats.conversionRate.toString()}
                    icon={Users}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-slate-800">Follow-ups de Hoje</h3>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center">
                            Ver todos <ArrowRight size={16} className="ml-1" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <EmptyState message="Nenhum follow-up agendado para hoje." />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-slate-800">Últimas Interações</h3>
                    </div>
                    <div className="space-y-4">
                        <EmptyState message="Nenhuma interação recente." />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${colors[color]}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Calendar size={20} className="text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm">{message}</p>
    </div>
);

export default CrmDashboard;
