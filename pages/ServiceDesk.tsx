import React, { useState, useEffect } from 'react';
import { fetchServiceOrders, createServiceOrder } from '../services/dataService';
import { OSStatus, ServiceOrder } from '../types';
import { ClipboardList, Clock, CheckCircle, Truck, AlertOctagon, Plus, X, Smartphone, User, FileText } from 'lucide-react';

const ServiceDesk: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <ClipboardList size={48} className="mb-4 opacity-50" />
            <p>Nenhuma Ordem de Serviço aberta.</p>
          </div>
        ) : (
          orders.map((os) => {
            const StatusIcon = getStatusIcon(os.status);

            return (
              <div key={os.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded">
                    {os.id}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center border ${getStatusColor(os.status)}`}>
                    <StatusIcon size={12} className="mr-1" />
                    {os.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800">{os.deviceModel}</h3>
                <p className="text-sm text-slate-500 mb-4 truncate">{os.problemDescription}</p>

                <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-medium text-slate-700">{os.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entrada:</span>
                    <span className="text-slate-700">{new Date(os.entryDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Mini Checklist Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Checklist Inicial</p>
                    <span className="text-[10px] text-slate-400">Verde = OK</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(os.checklist || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className={`w-2.5 h-2.5 rounded-full ${value ? 'bg-green-500' : 'bg-red-400'}`}
                        title={`${key}: ${value ? 'OK' : 'Falha'}`}
                      ></div>
                    ))}
                  </div>
                </div>

                <button className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Gerenciar OS
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
    </div>
  );
};

export default ServiceDesk;
