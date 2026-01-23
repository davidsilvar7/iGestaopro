import React, { useState, useEffect } from 'react';
import { fetchServiceOrders, createServiceOrder, updateServiceOrder } from '../services/dataService';
import { OSStatus, ServiceOrder } from '../types';
import { ClipboardList, Clock, CheckCircle, Truck, AlertOctagon, Plus, X, Smartphone, User, FileText, Save, MessageCircle, Printer } from 'lucide-react';
import ServiceOrderReceipt from '../components/ServiceOrderReceipt';

const ServiceDesk: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit Mode State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  // Form State
  const [newOS, setNewOS] = useState({
    customerName: '',
    deviceModel: '',
    problemDescription: '',
    checklist: {
      faceId: false,
      screen: false,
      audio: false,
      camera: false,
      charging: false,
      wifi: false
    }
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const data = await fetchServiceOrders();
    setOrders(data);
  };

  const getStatusColor = (status: OSStatus) => {
    switch (status) {
      case OSStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case OSStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OSStatus.READY: return 'bg-green-100 text-green-700 border-green-200';
      case OSStatus.DELIVERED: return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100';
    }
  };

  const getStatusIcon = (status: OSStatus) => {
    switch (status) {
      case OSStatus.PENDING: return Clock;
      case OSStatus.IN_PROGRESS: return AlertOctagon;
      case OSStatus.READY: return CheckCircle;
      case OSStatus.DELIVERED: return Truck;
      default: return ClipboardList;
    }
  };

  const handleCheckboxChange = (key: string) => {
    setNewOS(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key as keyof typeof prev.checklist] }
    }));
  };

  const handleSaveOS = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOS.customerName || !newOS.deviceModel || !newOS.problemDescription) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const orderData: Omit<ServiceOrder, 'id'> = {
      customerName: newOS.customerName,
      deviceModel: newOS.deviceModel,
      problemDescription: newOS.problemDescription,
      status: OSStatus.PENDING,
      entryDate: new Date().toISOString(),
      total: 0,
      checklist: newOS.checklist
    };

    const saved = await createServiceOrder(orderData);
    if (saved) {
      setOrders([saved, ...orders]);
      setIsModalOpen(false);

      // Reset Form
      setNewOS({
        customerName: '',
        deviceModel: '',
        problemDescription: '',
        checklist: {
          faceId: false,
          screen: false,
          audio: false,
          camera: false,
          charging: false,
          wifi: false
        }
      });
    }
  };

  const handleEditOS = (os: ServiceOrder) => {
    setSelectedOS(os);
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: OSStatus) => {
    if (!selectedOS) return;

    const updated = await updateServiceOrder(selectedOS.id, { status: newStatus });
    if (updated) {
      setOrders(orders.map(o => o.id === selectedOS.id ? updated : o));
      setSelectedOS(updated); // Update local selected state
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Hidden Receipt Component */}
      <ServiceOrderReceipt data={selectedOS} />

      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assistência Técnica</h1>
          <p className="text-slate-500">Gestão de Ordens de Serviço (OS)</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium flex items-center transition-transform active:scale-95"
        >
          <Plus size={18} className="mr-2" /> Nova OS
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <th className="px-6 py-4">OS ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Aparelho</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Entrada</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardList size={40} className="mb-3 opacity-50" />
                      <p>Nenhuma Ordem de Serviço aberta.</p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        + Criar primeira OS
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleEditOS(os)}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        #{os.id.substring(0, 6)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                          {os.customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{os.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-700">{os.deviceModel}</p>
                        <p className="text-slate-500 text-xs truncate max-w-[150px]">{os.problemDescription}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(os.status)}`}>
                        {os.status === 'Em Execução' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />}
                        {os.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(os.entryDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditOS(os); }}
                        className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <ClipboardList className="mr-2 text-blue-600" size={20} /> Abrir Nova OS
              </h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="os-form" onSubmit={handleSaveOS} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                    <User size={14} className="mr-1" /> Nome do Cliente
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    placeholder="Ex: João da Silva"
                    value={newOS.customerName}
                    onChange={e => setNewOS({ ...newOS, customerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                    <Smartphone size={14} className="mr-1" /> Modelo do Aparelho
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    placeholder="Ex: iPhone 12 Pro Azul"
                    value={newOS.deviceModel}
                    onChange={e => setNewOS({ ...newOS, deviceModel: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                    <FileText size={14} className="mr-1" /> Relato do Problema
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white text-slate-900"
                    placeholder="Ex: Tela quebrada, faceID parou..."
                    value={newOS.problemDescription}
                    onChange={e => setNewOS({ ...newOS, problemDescription: e.target.value })}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Checklist de Entrada (Obrigatório)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'screen', label: 'Tela/Touch' },
                      { id: 'faceId', label: 'Face ID' },
                      { id: 'audio', label: 'Áudio' },
                      { id: 'camera', label: 'Câmeras' },
                      { id: 'charging', label: 'Carregamento' },
                      { id: 'wifi', label: 'Wi-Fi/Sinal' },
                    ].map(item => (
                      <label key={item.id} className="flex items-center space-x-2 cursor-pointer select-none">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newOS.checklist[item.id as keyof typeof newOS.checklist] ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}>
                          {newOS.checklist[item.id as keyof typeof newOS.checklist] && <CheckCircle size={12} />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={newOS.checklist[item.id as keyof typeof newOS.checklist]}
                          onChange={() => handleCheckboxChange(item.id)}
                        />
                        <span className={`text-sm ${newOS.checklist[item.id as keyof typeof newOS.checklist] ? 'text-green-700 font-medium' : 'text-slate-600'}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">* Marque apenas o que está funcionando.</p>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="os-form"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium transition-transform active:scale-95"
              >
                Abrir Ordem de Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerenciar OS */}
      {isEditModalOpen && selectedOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Smartphone className="mr-2 text-purple-600" size={20} /> Gerenciar OS #{selectedOS.id.substring(0, 8)}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2">{selectedOS.deviceModel}</h3>
                    <p className="text-slate-500 text-sm">{selectedOS.problemDescription}</p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Imprimir OS"
                  >
                    <Printer size={20} />
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  <p>Cliente: <span className="text-slate-600 font-semibold">{selectedOS.customerName}</span></p>
                  <p>Entrada: <span className="text-slate-600">{new Date(selectedOS.entryDate).toLocaleDateString('pt-BR')}</span></p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Atualizar Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: OSStatus.PENDING, label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
                    { id: OSStatus.IN_PROGRESS, label: 'Em Execução', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
                    { id: OSStatus.READY, label: 'Pronto', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => handleUpdateStatus(status.id)}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all ${selectedOS.status === status.id
                        ? `${status.color} ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>

                {/* WhatsApp Button */}
                <button
                  onClick={() => {
                    const text = `Olá ${selectedOS.customerName}, o status do seu ${selectedOS.deviceModel} mudou para: ${selectedOS.status}.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full mt-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm"
                >
                  <MessageCircle size={20} className="mr-2" />
                  Enviar Status no WhatsApp
                </button>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Finalizar Serviço</h4>
                <p className="text-xs text-slate-500 mb-3">Ao finalizar, o status muda para Entregue.</p>
                <button
                  onClick={() => handleUpdateStatus(OSStatus.DELIVERED)}
                  className={`w-full p-3 rounded-lg font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center ${selectedOS.status === OSStatus.DELIVERED
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                    }`}
                  disabled={selectedOS.status === OSStatus.DELIVERED}
                >
                  <CheckCircle size={18} className="mr-2" />
                  {selectedOS.status === OSStatus.DELIVERED ? 'Serviço Já Finalizado' : 'Finalizar e Entregar'}
                </button>
              </div>

            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServiceDesk;
