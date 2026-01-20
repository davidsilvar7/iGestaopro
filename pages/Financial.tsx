import React, { useState, useEffect, useMemo } from 'react';
import { fetchTransactions } from '../services/dataService';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

const Financial: React.FC = () => {
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

    const metrics = useMemo(() => {
        let income = 0;
        let expenses = 0; // We don't have explicit expenses table yet, but we have costs
        let profit = 0;

        transactions.forEach(t => {
            income += t.totalAmount;
            expenses += t.totalCost; // Using COGS as expenses for now
            profit += t.totalProfit;
        });

        return { income, expenses, profit };
    }, [transactions]);

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando dados financeiros...</div>;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
                <p className="text-slate-500">Fluxo de caixa e resultados</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Receitas (Vendas)</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ {metrics.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Custos (CMV)</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">R$ {metrics.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Resultado Líquido</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">R$ {metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Transaction History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Histórico de Transações</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Exportar Relatório</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Itens</th>
                                <th className="px-6 py-4 text-right">Valor Total</th>
                                <th className="px-6 py-4 text-right">Lucro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Nenhuma transação registrada.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {new Date(t.date).toLocaleDateString('pt-BR')} <span className="text-slate-400 ml-1">{new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {t.type === 'SALE' ? 'Venda' : t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {t.items.length} itens ({t.items.map(i => i.name).join(', ').slice(0, 30)}...)
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-800">
                                            R$ {t.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-green-600">
                                            R$ {t.totalProfit.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Financial;
