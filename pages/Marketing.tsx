import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { createCampaign, fetchCampaigns, fetchCampaignTargets, markTargetAsSent } from '../services/dataService';
import { Campaign, CampaignTarget, Customer } from '../types';
import { Plus, Send, CheckCircle, MessageSquare, Filter, Users, RefreshCw } from 'lucide-react';

const Marketing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'builder'>('campaigns');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    // Builder State
    const [campaignName, setCampaignName] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, tudo bem?');
    const [selectedDevice, setSelectedDevice] = useState('');
    const [previewCount, setPreviewCount] = useState(0);
    const [targetCustomers, setTargetCustomers] = useState<Customer[]>([]);

    // Worklist State
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [targets, setTargets] = useState<CampaignTarget[]>([]);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        const data = await fetchCampaigns();
        setCampaigns(data);
        setLoading(false);
    };

    const handlePreviewFilter = async () => {
        let query = supabase.from('customers').select('*');

        if (selectedDevice) {
            query = query.ilike('device_owned', `%${selectedDevice}%`);
        }
        // Add more filters here as needed

        const { data } = await query;
        if (data) {
            setTargetCustomers(data as any);
            setPreviewCount(data.length);
        }
    };

    const handleCreateCampaign = async () => {
        if (!campaignName || !messageTemplate || targetCustomers.length === 0) return;

        setLoading(true);
        const campaignId = await createCampaign(
            campaignName,
            messageTemplate,
            { device: selectedDevice },
            targetCustomers
        );

        if (campaignId) {
            alert('Campanha criada com sucesso!');
            setActiveTab('campaigns');
            loadCampaigns();
            // Reset form
            setCampaignName('');
            setMessageTemplate('');
            setSelectedDevice('');
            setTargetCustomers([]);
            setPreviewCount(0);
        }
        setLoading(false);
    };

    const openWorklist = async (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setLoading(true);
        const t = await fetchCampaignTargets(campaign.id);
        setTargets(t);
        setLoading(false);
    };

    const handleSend = async (target: CampaignTarget) => {
        if (!selectedCampaign || !target.customerPhone) return;

        // Replace variables
        const text = selectedCampaign.messageTemplate.replace('{nome}', target.customerName || 'Cliente');

        // Open WhatsApp
        const url = `https://api.whatsapp.com/send?phone=${target.customerPhone.replace(/\D/g, '')}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');

        // Mark as sent
        await markTargetAsSent(target.id);

        // Update local state
        setTargets(targets.map(t => t.id === target.id ? { ...t, status: 'SENT', sentAt: new Date().toISOString() } : t));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Marketing & Mensagens</h1>
                    <p className="text-slate-500">Campanhas via WhatsApp</p>
                </div>
                {activeTab === 'campaigns' && !selectedCampaign && (
                    <button
                        onClick={() => setActiveTab('builder')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                    >
                        <Plus size={20} className="mr-2" /> Nova Campanha
                    </button>
                )}
                {(activeTab === 'builder' || selectedCampaign) && (
                    <button
                        onClick={() => { setActiveTab('campaigns'); setSelectedCampaign(null); }}
                        className="text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Voltar
                    </button>
                )}
            </div>

            {/* Campaign Builder */}
            {activeTab === 'builder' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Criar Nova Campanha</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Campanha</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Promoção iPhone 12"
                                    value={campaignName}
                                    onChange={e => setCampaignName(e.target.value)}
                                />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="font-semibold text-slate-700 mb-3 flex items-center"><Filter size={18} className="mr-2" /> Segmentação</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Filtrar por Dispositivo</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none"
                                            placeholder="Ex: iPhone"
                                            value={selectedDevice}
                                            onChange={e => setSelectedDevice(e.target.value)}
                                        />
                                        <button
                                            onClick={handlePreviewFilter}
                                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {previewCount > 0 ? (
                                            <span className="text-green-600 font-bold flex items-center mt-2">
                                                <Users size={14} className="mr-1" /> {previewCount} clientes encontrados
                                            </span>
                                        ) : 'Nenhum filtro aplicado ou sem resultados.'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem (Template)</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={messageTemplate}
                                    onChange={e => setMessageTemplate(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 mt-1">Use <strong>{'{nome}'}</strong> para inserir o nome do cliente automaticamente.</p>
                            </div>

                            <button
                                onClick={handleCreateCampaign}
                                disabled={previewCount === 0 || !campaignName}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                            >
                                Gerar Lista de Envio
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 flex flex-col items-center justify-center text-center">
                            <div className="bg-[#E5DDD5] w-64 h-96 rounded-lg shadow-inner overflow-hidden flex flex-col relative">
                                <div className="bg-[#075E54] h-12 w-full flex items-center px-4">
                                    <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                                    <div className="ml-2 h-2 w-20 bg-white/50 rounded"></div>
                                </div>
                                <div className="flex-1 p-4 flex flex-col justify-end">
                                    <div className="bg-white p-2 rounded-lg rounded-tl-none shadow text-left text-sm text-[13px] text-slate-800 leading-snug">
                                        {messageTemplate.replace('{nome}', 'Fulano')}
                                        <div className="text-[10px] text-slate-400 text-right mt-1">10:00</div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-slate-500 text-sm font-medium">Prévia da Mensagem no WhatsApp</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign List */}
            {activeTab === 'campaigns' && !selectedCampaign && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhuma campanha criada ainda.</p>
                        </div>
                    ) : (
                        campaigns.map(c => (
                            <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-slate-800 text-lg">{c.name}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 italic">"{c.messageTemplate}"</p>
                                <div className="flex justify-between items-center text-xs text-slate-400 mb-6">
                                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                    {c.filters.deviceName && <span className="bg-slate-100 px-2 py-1 rounded">Dispositivo: {c.filters.deviceName}</span>}
                                </div>
                                <button
                                    onClick={() => openWorklist(c)}
                                    className="w-full py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                                >
                                    Abrir Lista de Envio
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Worklist (Campaign Details) */}
            {selectedCampaign && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-slate-800 flex items-center">
                                <MessageSquare size={18} className="mr-2 text-blue-600" />
                                {selectedCampaign.name}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {targets.filter(t => t.status === 'SENT').length} enviados de {targets.length} total
                            </p>
                        </div>
                        <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${(targets.filter(t => t.status === 'SENT').length / targets.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-0">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0 z-10 text-xs text-slate-500 uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">Telefone</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {targets.map(t => (
                                    <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'SENT' ? 'bg-slate-50/50' : ''}`}>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {t.customerName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm font-mono">
                                            {t.customerPhone}
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.status === 'SENT' ? (
                                                <span className="flex items-center text-green-600 text-xs font-bold">
                                                    <CheckCircle size={14} className="mr-1" /> Enviado
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-medium">Pendente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {t.status !== 'SENT' && (
                                                <button
                                                    onClick={() => handleSend(t)}
                                                    className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center ml-auto transition-transform active:scale-95"
                                                >
                                                    <Send size={14} className="mr-2" /> Enviar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
