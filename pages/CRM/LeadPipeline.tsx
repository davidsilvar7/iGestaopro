import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Customer, LeadStatus } from '../../types';

const LeadPipeline: React.FC = () => {
    const [leads, setLeads] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLead, setNewLead] = useState({
        name: '',
        phone: '',
        interest: '',
        status: 'NEW' as LeadStatus,
        opportunityValue: 0,
        nextAction: ''
    });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('lifecycle_stage', 'LEAD')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            // Map snake_case to camelCase
            const mappedLeads: Customer[] = (data || []).map((l: any) => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                email: l.email,
                lifecycleStage: l.lifecycle_stage,
                status: l.status,
                interest: l.interest,
                createdAt: l.created_at,
                updatedAt: l.updated_at,
                // Add default values for enriched fields if they don't exist yet
                // In a real app we'd fetch these from a separate table or enriched query
            }));
            setLeads(mappedLeads);
        }
        setLoading(false);
    };

    const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
        // Logic for converting to Client
        if (newStatus === 'WON') {
            const confirmed = window.confirm('Parabéns pela venda! Deseja converter este Lead em Cliente oficial?');
            if (confirmed) {
                const { error: upgradeError } = await supabase
                    .from('customers')
                    .update({
                        status: newStatus,
                        lifecycle_stage: 'CLIENT'
                    })
                    .eq('id', id);

                if (!upgradeError) {
                    // Remove from local leads state since it's now a client
                    setLeads(leads.filter(lead => lead.id !== id));
                    return;
                }
            }
        }

        // Standard status update
        const { error } = await supabase
            .from('customers')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            return;
        }

        setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
    };

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('customers')
            .insert([{
                name: newLead.name,
                phone: newLead.phone,
                interest: newLead.interest,
                status: newLead.status,
                lifecycle_stage: 'LEAD',
                opportunity_value: newLead.opportunityValue,
                next_action: newLead.nextAction
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating lead:', error);
            alert('Erro ao criar lead');
        } else {
            // Map response too
            const mappedLead: Customer = {
                id: data.id,
                name: data.name,
                phone: data.phone,
                lifecycleStage: data.lifecycle_stage,
                status: data.status,
                interest: data.interest,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            setLeads([mappedLead, ...leads]);
            setIsModalOpen(false);
            setNewLead({ name: '', phone: '', interest: '', status: 'NEW', opportunityValue: 0, nextAction: '' });
        }
    };

    const columns: { id: LeadStatus; label: string; color: string }[] = [
        { id: 'NEW', label: 'Novos', color: 'bg-blue-100 text-blue-800' },
        { id: 'CONTACTED', label: 'Contatado', color: 'bg-yellow-100 text-yellow-800' },
        { id: 'VISIT', label: 'Visita Agendada', color: 'bg-indigo-100 text-indigo-800' },
        { id: 'NEGOTIATION', label: 'Em Negociação', color: 'bg-purple-100 text-purple-800' },
        { id: 'WON', label: 'Fechado/Ganho', color: 'bg-green-100 text-green-800' },
        { id: 'LOST', label: 'Perdido', color: 'bg-red-100 text-red-800' },
    ];

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando pipeline...</div>;

    return (
        <div className="h-full flex flex-col p-6 max-w-full overflow-hidden relative">
            <div className="flex-none mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Pipeline de Vendas</h1>
                    <p className="text-slate-500">Gestão visual do funil de vendas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Novo Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex h-full space-x-4 min-w-max">
                    {columns.map(column => (
                        <div key={column.id} className="w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col max-h-full">
                            <div className={`p-3 border-b border-slate-200 flex justify-between items-center rounded-t-xl ${column.color.split(' ')[0]}`}>
                                <span className={`font-semibold text-sm ${column.color.split(' ')[1]}`}>{column.label}</span>
                                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {leads.filter(l => l.status === column.id).length}
                                </span>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                {leads.filter(l => l.status === column.id).map(lead => (
                                    <LeadCard key={lead.id} lead={lead} onMove={(status) => updateLeadStatus(lead.id, status)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Lead Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">Novo Lead</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Nome do cliente"
                                    value={newLead.name}
                                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Oportunidade (R$)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0,00"
                                    onChange={(e) => {
                                        // Quick hack to store in component state if we had it, 
                                        // for now I'll just rely on the fact that I need to update the state to hold this new value
                                        // But wait, 'newLead' state in LeadPipeline.tsx doesn't have opportunityValue yet.
                                        // I need to update the state definition first.
                                        // See next step.
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Oportunidade (R$)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0,00"
                                    value={newLead.opportunityValue || ''}
                                    onChange={e => setNewLead({ ...newLead, opportunityValue: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Ação (Ex: Ligar amanhã)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Ligar dia 25/01"
                                    value={newLead.nextAction}
                                    onChange={e => setNewLead({ ...newLead, nextAction: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone/WhatsApp</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="(00) 00000-0000"
                                    value={newLead.phone}
                                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Interesse</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: iPhone 13, Troca de Tela..."
                                    value={newLead.interest}
                                    onChange={e => setNewLead({ ...newLead, interest: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Criar Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const LeadCard = ({ lead, onMove }: { lead: Customer; onMove: (s: LeadStatus) => void }) => {
    // Helper to safely format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Data inv.';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data inv.';
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } catch {
            return 'Data inv.';
        }
    };

    return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold text-slate-800">{lead.name}</h4>
                    {lead.opportunityValue && (
                        <span className="text-xs font-bold text-green-600">
                            R$ {lead.opportunityValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    )}
                </div>
                {lead.status === 'NEGOTIATION' && <span title="Quente" className="text-xs">🔥</span>}
            </div>
            <p className="text-xs text-slate-500 mb-2">{lead.interest || 'Interesse não informado'}</p>
            {lead.nextAction && (
                <div className="mb-2 flex items-center text-xs text-orange-600 bg-orange-50 p-1.5 rounded">
                    <span className="mr-1">📅</span> {lead.nextAction}
                </div>
            )}

            {/* Enriching Card UI */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 py-0.5 rounded">
                    Criado: {formatDate(lead.createdAt)}
                </span>
                <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); onMove('WON'); }} className="p-1 hover:bg-green-50 text-green-600 rounded" title="Marcar como Ganho">
                        <div className="w-3 h-3 rounded-full bg-green-500 hover:scale-125 transition-transform shadow-sm" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMove('LOST'); }} className="p-1 hover:bg-red-50 text-red-600 rounded" title="Marcar como Perdido">
                        <div className="w-3 h-3 rounded-full bg-red-400 hover:scale-125 transition-transform shadow-sm" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadPipeline;
