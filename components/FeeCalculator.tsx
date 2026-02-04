import React, { useState, useEffect } from 'react';
import { Calculator, X, Settings, ChevronRight, Save, RotateCcw, CreditCard, Banknote } from 'lucide-react';

// --- INITIAL DEFAULT RATES ---
const DEFAULT_RATES: Record<string, number> = {
    'DEBIT': 1.99,
    '1': 4.50,
    '2': 5.50,
    '3': 6.50,
    '4': 7.50,
    '5': 8.50,
    '6': 9.50,
    '7': 10.50,
    '8': 11.50,
    '9': 12.50,
    '10': 13.50,
    '11': 14.50,
    '12': 15.50,
    '18': 21.50, // Common extended installment
};

// Generate 2-18 range if needed, but defaults cover most.
// We'll allow editing specific keys.

interface FeeCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    initialNetValue: number;
}

const FeeCalculator: React.FC<FeeCalculatorProps> = ({ isOpen, onClose, initialNetValue }) => {
    // --- STATE ---
    const [view, setView] = useState<'CALCULATOR' | 'SETTINGS'>('CALCULATOR');

    // Rates State (Persisted)
    const [rates, setRates] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('pos_fee_rates');
        return saved ? JSON.parse(saved) : DEFAULT_RATES;
    });

    // Calculator State
    const [netValue, setNetValue] = useState<string>('');
    const [selectedInstallment, setSelectedInstallment] = useState<string>('1'); // 'DEBIT', '1', '2'...
    const [grossValue, setGrossValue] = useState<number>(0);
    const [installmentValue, setInstallmentValue] = useState<number>(0);
    const [totalFee, setTotalFee] = useState<number>(0);

    // --- EFFECTS ---
    useEffect(() => {
        if (isOpen) {
            setNetValue(initialNetValue > 0 ? initialNetValue.toFixed(2) : '');
            setSelectedInstallment('1');
            setView('CALCULATOR');
        }
    }, [isOpen, initialNetValue]);

    useEffect(() => {
        calculateValues();
    }, [netValue, selectedInstallment, rates]);

    // --- ACTIONS ---

    const calculateValues = () => {
        const net = parseFloat(netValue);
        if (isNaN(net) || net <= 0) {
            setGrossValue(0);
            setInstallmentValue(0);
            setTotalFee(0);
            return;
        }

        const rate = rates[selectedInstallment] || 0;

        // Formula: Net / (1 - Rate/100) -> Buyer Pays logic (Repasse)
        // Check for 100% rate edge case to avoid div by zero
        if (rate >= 100) {
            setGrossValue(0);
            return;
        }

        const gross = net / (1 - (rate / 100));

        setGrossValue(gross);
        setTotalFee(gross - net);

        // Installment Value
        const installments = selectedInstallment === 'DEBIT' ? 1 : parseInt(selectedInstallment);
        setInstallmentValue(gross / (installments || 1));
    };

    const handleSaveRates = () => {
        localStorage.setItem('pos_fee_rates', JSON.stringify(rates));
        setView('CALCULATOR');
    };

    const handleResetRates = () => {
        if (window.confirm("Restaurar taxas padrão?")) {
            setRates(DEFAULT_RATES);
            localStorage.setItem('pos_fee_rates', JSON.stringify(DEFAULT_RATES));
        }
    };

    const updateRate = (key: string, value: string) => {
        const num = parseFloat(value);
        setRates(prev => ({
            ...prev,
            [key]: isNaN(num) ? 0 : num
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* --- HEADER --- */}
                <div className="bg-slate-900 px-6 py-5 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            {view === 'CALCULATOR' ? <Calculator size={20} /> : <Settings size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">
                                {view === 'CALCULATOR' ? 'Calculadora de Taxas' : 'Configurar Taxas'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {view === 'CALCULATOR' ? 'Simulador de Repasse' : 'Defina os juros da maquininha'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {view === 'CALCULATOR' && (
                            <button onClick={() => setView('SETTINGS')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white" title="Configurar Taxas">
                                <Settings size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* --- BODY (CALCULATOR) --- */}
                {view === 'CALCULATOR' && (
                    <div className="p-6 space-y-6 overflow-y-auto">

                        {/* Input Valor Líquido */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">
                                Valor a Receber (Líquido)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input
                                    type="number"
                                    value={netValue}
                                    onChange={(e) => setNetValue(e.target.value)}
                                    className="w-full pl-10 pr-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-mono text-2xl font-bold text-slate-800 transition-all shadow-sm"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Payment Type Tabs */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-3">
                                Modalidade
                            </label>

                            {/* Special Types */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setSelectedInstallment('DEBIT')}
                                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${selectedInstallment === 'DEBIT'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
                                        }`}
                                >
                                    <Banknote size={18} className="mr-2" /> Débito ({rates['DEBIT']}%)
                                </button>
                                <button
                                    onClick={() => setSelectedInstallment('1')}
                                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${selectedInstallment === '1'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
                                        }`}
                                >
                                    <CreditCard size={18} className="mr-2" /> Crédito 1x ({rates['1']}%)
                                </button>
                            </div>

                            {/* Installments Grid */}
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {Object.keys(rates)
                                    .filter(k => k !== 'DEBIT' && k !== '1')
                                    .sort((a, b) => parseInt(a) - parseInt(b))
                                    .map((k) => (
                                        <button
                                            key={k}
                                            onClick={() => setSelectedInstallment(k)}
                                            className={`py-2 rounded-lg text-sm font-bold transition-all border ${selectedInstallment === k
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {k}x
                                        </button>
                                    ))}
                            </div>
                        </div>

                        {/* Result Card */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-600 rounded-full opacity-20 filter blur-2xl"></div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                    <span className="text-slate-400 text-sm font-medium">Cobrar do Cliente</span>
                                    <span className="text-3xl font-bold text-green-400">R$ {grossValue.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">
                                            Parcela ({selectedInstallment === 'DEBIT' ? 'À vista' : `${selectedInstallment}x`})
                                        </span>
                                        <span className="font-mono text-lg font-medium">R$ {installmentValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Taxa da Maquininha ({rates[selectedInstallment]}%)</span>
                                        <span>+ R$ {totalFee.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- BODY (SETTINGS) --- */}
                {view === 'SETTINGS' && (
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <span className="w-1 h-6 bg-blue-500 rounded mr-2"></span>
                                Taxas Principais (%)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Débito</label>
                                    <div className="relative mt-1">
                                        <input
                                            type="number"
                                            value={rates['DEBIT']}
                                            onChange={(e) => updateRate('DEBIT', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 border rounded-lg focus:blue-500 outline-none font-mono text-slate-700"
                                        />
                                        <span className="absolute right-3 top-2 text-slate-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Crédito 1x</label>
                                    <div className="relative mt-1">
                                        <input
                                            type="number"
                                            value={rates['1']}
                                            onChange={(e) => updateRate('1', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 border rounded-lg focus:blue-500 outline-none font-mono text-slate-700"
                                        />
                                        <span className="absolute right-3 top-2 text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <span className="w-1 h-6 bg-purple-500 rounded mr-2"></span>
                                Parcelamento (%)
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(rates)
                                    .filter(k => k !== 'DEBIT' && k !== '1')
                                    .sort((a, b) => parseInt(a) - parseInt(b))
                                    .map(k => (
                                        <div key={k}>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase text-center block mb-1">{k}x</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={rates[k]}
                                                    onChange={(e) => updateRate(k, e.target.value)}
                                                    className="w-full px-2 py-1.5 border rounded-lg focus:border-purple-500 outline-none font-mono text-sm text-center text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleResetRates}
                                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center text-sm"
                            >
                                <RotateCcw size={16} className="mr-2" /> Padrão
                            </button>
                            <button
                                onClick={handleSaveRates}
                                className="flex-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center shadow-lg"
                            >
                                <Save size={18} className="mr-2" /> Salvar Configuração
                            </button>
                        </div>
                    </div>
                )}

                {/* --- FOOTER (ONLY CALCULATOR) --- */}
                {view === 'CALCULATOR' && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end shrink-0">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center shadow-lg hover:shadow-xl"
                        >
                            Concluir <ChevronRight size={18} className="ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeCalculator;
