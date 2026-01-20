import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Smartphone, BrainCircuit, Wrench, Zap } from 'lucide-react';
import { fetchTransactions, fetchInventory } from '../services/dataService';
import { analyzeBusinessHealth } from '../services/geminiService';
import { ItemCategory, InventoryItem, Transaction } from '../types';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

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

  // --- CÁLCULOS REAIS ---
  const kpiData = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let servicesProfit = 0;
    let iPhoneSalesCount = 0;
    let iPhoneRevenue = 0;

    transactions.forEach(t => {
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
    const serviceMargin = servicesProfit > 0 ? (servicesProfit / totalRevenue) * 100 : 0; // Simplified

    return { totalRevenue, totalProfit, averageTicketIphone, servicesProfit, globalMargin };
  }, [transactions]);

  // Gráfico de Pizza: Lucro por Categoria
  const profitByCategory = useMemo(() => {
    const data = {
      [ItemCategory.IPHONE]: 0,
      [ItemCategory.ANDROID]: 0,
      [ItemCategory.ANDROID_USED]: 0,
      [ItemCategory.SERVICE]: 0,
      [ItemCategory.ACCESSORY]: 0,
    };

    transactions.forEach(t => {
      t.items.forEach(item => {
        const profit = item.sellPrice - item.costPrice;
        if (data[item.category] !== undefined) {
          data[item.category] += profit;
        }
      });
    });

    const formattedData = [
      { name: 'iPhones', value: data[ItemCategory.IPHONE] },
      { name: 'Androids', value: data[ItemCategory.ANDROID] + data[ItemCategory.ANDROID_USED] }, // Agrupando novos e usados para simplificar visual
      { name: 'Serviços', value: data[ItemCategory.SERVICE] },
      { name: 'Acessórios', value: data[ItemCategory.ACCESSORY] },
    ].filter(d => d.value > 0);

    return formattedData.length > 0 ? formattedData : [{ name: 'Sem dados', value: 1 }];
  }, []);

  // Gráfico de Barras: Vendas (Simulado dias da semana ou vazio se não tiver dados)
  const revenueData = useMemo(() => {
    if (transactions.length === 0) {
      return [
        { name: 'Seg', val: 0 }, { name: 'Ter', val: 0 }, { name: 'Qua', val: 0 },
        { name: 'Qui', val: 0 }, { name: 'Sex', val: 0 }, { name: 'Sab', val: 0 }
      ];
    }
    // Em um app real, agruparia por data. Aqui retornamos vazio pois zeramos o banco.
    return [
      { name: 'Atual', val: kpiData.totalRevenue }
    ];
  }, [kpiData]);

  const COLORS = ['#3730a3', '#16a34a', '#2563eb', '#eab308', '#cbd5e1']; // Indigo, Green, Blue, Yellow, Slate (Empty)

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeBusinessHealth(transactions, inventory);
    setAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel de Lucratividade</h1>
          <p className="text-slate-500">Visão estratégica de margens e vendas</p>
        </div>
        <button
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-70"
        >
          <BrainCircuit size={20} className="mr-2" />
          {loadingAi ? 'Gerando Insights...' : 'IA Business Insight'}
        </button>
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
                <TrendingUp size={12} className="mr-1" /> Acumulado
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
            {transactions.length === 0 ? (
              <div className="text-slate-400 text-sm">Realize a primeira venda para visualizar os gráficos.</div>
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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Vendas Recentes</h3>
          <div className="h-64 flex items-center justify-center">
            {transactions.length === 0 ? (
              <div className="text-slate-400 text-sm">Nenhuma venda registrada ainda.</div>
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

      {/* Quick Actions / Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-xl text-white">
          <h4 className="font-bold text-lg mb-2">Setup Inicial</h4>
          <p className="text-indigo-100 text-sm mb-4">O sistema está limpo e pronto.</p>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm mb-2">
            <span className="block font-semibold">1. Cadastre Produtos</span>
            <span className="block text-sm opacity-80">Vá em "Estoque" para adicionar iPhones.</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center"><Wrench className="text-blue-500 mr-2" size={18} /> Serviços</h4>
          <p className="text-sm text-slate-500 mb-4">Preços de Telas (iPhone 11-16) e baterias já estão pré-carregados para o POS.</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center"><Zap className="text-yellow-500 mr-2" size={18} /> Dica</h4>
          <p className="text-sm text-slate-500">
            Use a calculadora de margem no PDV para garantir lucro saudável em cada negociação.
          </p>
        </div>
      </div>
    </div>
  );
};

const DollarSignIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export default Dashboard;