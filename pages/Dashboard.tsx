import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Smartphone, BrainCircuit, Wrench, Zap, Calendar } from 'lucide-react';
import { fetchTransactions, fetchInventory } from '../services/dataService';
import { analyzeBusinessHealth } from '../services/geminiService';
import { ItemCategory, InventoryItem, Transaction } from '../types';

type DateFilter = 'today' | '7days' | '30days' | 'thisMonth' | 'all';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');

  useEffect(() => {
    const loadData = async () => {
      const [trxData, invData] = await Promise.all([
        fetchTransactions(),
        fetchInventory()
      ]);
      setTransactions(trxData);
      setInventory(invData);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return transactions.filter(t => {
      const tDate = new Date(t.date).getTime();
      switch (dateFilter) {
        case 'today':
          return tDate >= todayStart;
        case '7days':
          return tDate >= now.getTime() - (7 * 24 * 60 * 60 * 1000);
        case '30days':
          return tDate >= now.getTime() - (30 * 24 * 60 * 60 * 1000);
        case 'thisMonth':
          return new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear();
        case 'all':
        default:
          return true;
      }
    });
  }, [transactions, dateFilter]);

  // --- CÁLCULOS REAIS ---
  const kpiData = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let servicesProfit = 0;
    let iPhoneSalesCount = 0;
    let iPhoneRevenue = 0;

    filteredTransactions.forEach(t => {
      totalRevenue += t.totalAmount;
      totalProfit += t.totalProfit;

      // Check individual items in transaction
      t.items.forEach(item => {
        if (item.category === ItemCategory.SERVICE) {
          servicesProfit += (item.sellPrice - item.costPrice);
        }
        if (item.category === ItemCategory.IPHONE) {
          iPhoneSalesCount++;
          iPhoneRevenue += item.sellPrice;
        }
      });
    });

    const averageTicketIphone = iPhoneSalesCount > 0 ? iPhoneRevenue / iPhoneSalesCount : 0;
    const globalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalProfit, averageTicketIphone, servicesProfit, globalMargin };
  }, [filteredTransactions]);

  // Gráfico de Pizza: Lucro por Categoria
  const profitByCategory = useMemo(() => {
    const data = {
      [ItemCategory.IPHONE]: 0,
      [ItemCategory.ANDROID]: 0,
      [ItemCategory.ANDROID_USED]: 0,
      [ItemCategory.SERVICE]: 0,
      [ItemCategory.ACCESSORY]: 0,
    };

    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        const profit = item.sellPrice - item.costPrice;
        if (data[item.category] !== undefined) {
          data[item.category] += profit;
        }
      });
    });

    const formattedData = [
      { name: 'iPhones', value: data[ItemCategory.IPHONE] },
      { name: 'Androids', value: data[ItemCategory.ANDROID] + data[ItemCategory.ANDROID_USED] },
      { name: 'Serviços', value: data[ItemCategory.SERVICE] },
      { name: 'Acessórios', value: data[ItemCategory.ACCESSORY] },
    ].filter(d => d.value > 0);

    return formattedData.length > 0 ? formattedData : [{ name: 'Sem dados', value: 1 }];
  }, [filteredTransactions]);

  // Gráfico de Barras: Vendas (Timeline Real)
  const revenueData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // 1. Group by Date (DD/MM)
    const grouped: Record<string, number> = {};
    const dates = new Set<string>();

    // Fill helpful timeline if filtered
    const now = new Date();
    const daysToShow = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 0;

    if (daysToShow > 0) {
      for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        grouped[key] = 0;
      }
    }

    filteredTransactions.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      grouped[key] = (grouped[key] || 0) + t.totalAmount;
    });

    return Object.entries(grouped).map(([name, val]) => ({ name, val }));
  }, [filteredTransactions, dateFilter]);

  const COLORS = ['#3730a3', '#16a34a', '#2563eb', '#eab308', '#cbd5e1'];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeBusinessHealth(filteredTransactions, inventory);
    setAnalysis(result);
    setLoadingAi(false);
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case '7days': return 'Últimos 7 dias';
      case '30days': return 'Últimos 30 dias';
      case 'thisMonth': return 'Este Mês';
      case 'all': return 'Todo o Período';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel de Lucratividade</h1>
          <p className="text-slate-500">Visão estratégica de margens e vendas</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Filter Dropdown */}
          <div className="relative group">
            <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
              <Calendar size={16} className="mr-2 text-slate-500" />
              {getFilterLabel()}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-20 overflow-hidden">
              <button onClick={() => setDateFilter('today')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700">Hoje</button>
              <button onClick={() => setDateFilter('7days')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700">Últimos 7 dias</button>
              <button onClick={() => setDateFilter('30days')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700">Últimos 30 dias</button>
              <button onClick={() => setDateFilter('thisMonth')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700">Este Mês</button>
              <button onClick={() => setDateFilter('all')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700">Todo o Período</button>
            </div>
          </div>

          <button
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-70 text-sm font-medium"
          >
            <BrainCircuit size={18} className="mr-2" />
            {loadingAi ? 'Analisando...' : 'IA Insight'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
            <BrainCircuit size={18} className="mr-2 text-indigo-600" />
            Consultor Virtual
          </h3>
          <div className="prose prose-sm text-slate-700 max-w-none whitespace-pre-line">
            {analysis}
          </div>
        </div>
      )}

      {/* KPI Cards - Calculated from Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Faturamento Total</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                R$ {kpiData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-slate-400 flex items-center mt-1">
                <TrendingUp size={12} className="mr-1" /> {getFilterLabel()}
              </span>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <DollarSignIcon size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Lucro Líquido</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                R$ {kpiData.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-slate-400 flex items-center mt-1">
                Margem Global: {kpiData.globalMargin.toFixed(1)}%
              </span>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Ticket Médio (iPhone)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                R$ {kpiData.averageTicketIphone.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-indigo-500 mt-1">
                Vendas de Aparelhos
              </span>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Smartphone size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Lucro em Serviços</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                R$ {kpiData.servicesProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-blue-500 mt-1">
                Mão de Obra
              </span>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Wrench size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Profit Mix */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Origem do Lucro</h3>
          <div className="h-64 flex items-center justify-center">
            {filteredTransactions.length === 0 ? (
              <div className="text-slate-400 text-sm">Sem dados para este período.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {profitByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="ml-4 space-y-3">
                  {profitByCategory.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{entry.name}</span>
                        <span className="text-xs text-slate-500">
                          {kpiData.totalProfit > 0 ? ((entry.value / kpiData.totalProfit) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Vendas (Linha do Tempo)</h3>
          <div className="h-64 flex items-center justify-center">
            {revenueData.length === 0 ? (
              <div className="text-slate-400 text-sm">Sem dados para este período.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="val" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Actions Removed for brevity - kept in old version if needed, or simplified */}
    </div>
  );
};

const DollarSignIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export default Dashboard;