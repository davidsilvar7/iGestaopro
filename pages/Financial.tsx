import React, { useState, useEffect, useMemo } from 'react';
import { fetchTransactions, fetchExpenses, createExpense, deleteExpense } from '../services/dataService';
import { Transaction, Expense } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Trash2, Tag } from 'lucide-react';

const Financial: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // New Expense Form State
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Outros'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [trxData, expData] = await Promise.all([
            fetchTransactions(),
            fetchExpenses()
        ]);
        setTransactions(trxData);
        setExpenses(expData);
        setLoading(false);
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;

        const amount = parseFloat(newExpense.amount.replace(',', '.'));
        const created = await createExpense({
            description: newExpense.description,
            amount,
            category: newExpense.category,
            date: new Date().toISOString()
        });

        if (created) {
            setExpenses([created, ...expenses]);
            setNewExpense({ description: '', amount: '', category: 'Outros' });
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            const success = await deleteExpense(id);
            if (success) {
                setExpenses(expenses.filter(e => e.id !== id));
            }
        }
    };

    const metrics = useMemo(() => {
        let income = 0;
        let cogs = 0; // Cost of Goods Sold
        let grossProfit = 0;

        transactions.forEach(t => {
            income += t.totalAmount;
            cogs += t.totalCost;
            grossProfit += t.totalProfit;
        });

        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const netProfit = grossProfit - totalExpenses;

        return { income, cogs, grossProfit, totalExpenses, netProfit };
    }, [transactions, expenses]);

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando dados financeiros...</div>;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Financeiro & DRE</h1>
                <p className="text-slate-500">Fluxo de caixa, despesas e resultado líquido</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Receita Bruta</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ {metrics.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Custos (CMV)</p>
                            <h3 className="text-xl font-bold text-slate-600 mt-1">R$ {metrics.cogs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                            <Tag size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Despesas Operacionais</p>
                            <h3 className="text-xl font-bold text-red-500 mt-1">R$ {metrics.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Lucro Líquido Real</p>
                            <h3 className={`text-2xl font-bold mt-1 ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${metrics.netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Expense Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <Plus size={18} className="mr-2 text-blue-600" />
                            Lançar Despesa
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Aluguel da Loja"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0,00"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    <option value="Outros">Outros</option>
                                    <option value="Aluguel">Aluguel</option>
                                    <option value="Energia">Energia/Água</option>
                                    <option value="Internet">Internet/Sistemas</option>
                                    <option value="Pessoal">Pessoal/Salários</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Impostos">Impostos</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors shadow-lg"
                            >
                                Registrar Saída
                            </button>
                        </form>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Últimas Despesas</h3>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Descrição</th>
                                        <th className="px-6 py-3">Categoria</th>
                                        <th className="px-6 py-3 text-right">Valor</th>
                                        <th className="px-6 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                Nenhuma despesa lançada este mês.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 text-sm text-slate-600">
                                                    {new Date(exp.date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-700">
                                                    {exp.description}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-red-600">
                                                    - R$ {exp.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button
                                                        onClick={() => handleDeleteExpense(exp.id)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Financial;

