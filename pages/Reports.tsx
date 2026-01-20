import React, { useState, useEffect, useMemo } from 'react';
import { fetchTransactions } from '../services/dataService';
import { Transaction, ItemCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileText, Download, Filter } from 'lucide-react';

const Reports: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchTransactions();
            setTransactions(data);
            setLoading(false);
        };
        loadData();
    }, []);

    const COLORS = ['#3730a3', '#16a34a', '#2563eb', '#eab308', '#f43f5e'];

    // Data for Pie Chart (Sales by Category)
    const salesByCategory = useMemo(() => {
        const data: Record<string, number> = {};
        transactions.forEach(t => {
            t.items.forEach(item => {
                const cat = item.category;
                data[cat] = (data[cat] || 0) + item.sellPrice;
            });
        });

        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    // Data for Bar Chart (Daily Sales - Simulation since we might have little data)
    // Grouping by Date actually
    const salesByDate = useMemo(() => {
        const data: Record<string, number> = {};
        transactions.forEach(t => {
            const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
            data[dateStr] = (data[dateStr] || 0) + t.totalAmount;
        });
        // Fill at least some empty days to look like a chart if empty? No, just show real data.
        return Object.entries(data).map(([date, total]) => ({ date, total }));
    }, [transactions]);

    if (loading) return <div className="p-8 text-center text-slate-500">Gerando relatórios...</div>;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
                    <p className="text-slate-500">Análise detalhada de desempenho</p>
                </div>
                <div className="flex space-x-2">
                    <button className="flex items-center px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 bg-white">
                        <Filter size={18} className="mr-2" />
                        Filtrar
                    </button>
                    <button className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm">
                        <Download size={18} className="mr-2" />
                        Exportar PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sales By Category Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <FileText size={18} className="mr-2 text-indigo-500" />
                        Vendas por Categoria
                    </h3>
                    <div className="h-72 w-full">
                        {salesByCategory.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400">Sem dados de vendas.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {salesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Sales Trend Line Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <FileText size={18} className="mr-2 text-green-500" />
                        Desempenho Diário
                    </h3>
                    <div className="h-72 w-full">
                        {salesByDate.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400">Sem dados diários.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesByDate}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']} />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Products Table Stub */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Produtos Mais Vendidos</h3>
                <p className="text-sm text-slate-500 italic">Ranking em desenvolvimento...</p>
            </div>

        </div>
    );
};

export default Reports;
