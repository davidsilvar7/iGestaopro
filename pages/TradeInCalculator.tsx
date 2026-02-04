import React, { useState, useEffect } from 'react';
import {
    Smartphone,
    Calculator,
    Check,
    AlertTriangle,
    CreditCard,
    Save,
    RefreshCcw,
    RotateCcw,
    Battery,
    ShieldAlert,
    Search,
    ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabase';

// --- Types & Constants ---

type Grade = 'A' | 'B' | 'C';

interface TradeInState {
    // New Device
    newDeviceModel: string;
    newDevicePrice: number;

    // Used Device (Trade-in)
    usedDeviceModel: string;
    usedDeviceCapacity: string;
    usedDeviceMarketValue: number; // Base market value manually entered or fetched
    batteryBad: boolean; // < 80%
    grade: Grade;
    defects: {
        faceId: boolean;
        screen: boolean;
        camera: boolean;
        backGlass: boolean;
    };
}

const INITIAL_STATE: TradeInState = {
    newDeviceModel: '',
    newDevicePrice: 0,
    usedDeviceModel: '',
    usedDeviceCapacity: '128GB',
    usedDeviceMarketValue: 0,
    batteryBad: false,
    grade: 'A',
    defects: {
        faceId: false,
        screen: false,
        camera: false,
        backGlass: false
    }
};

// Configuration Constants (could be moved to Settings later)
const CONFIG = {
    SAFETY_MARGIN_PERCENT: 0.25, // 25% margin
    BATTERY_DEDUCTION: 250,      // R$ 250 fee for bad battery
    REPAIR_COSTS: {
        faceId: 300,
        screen: 500,
        camera: 250,
        backGlass: 200
    },
    GRADE_MULTIPLIER: {
        'A': 1.0, // 100%
        'B': 0.9, // 90%
        'C': 0.8  // 80%
    }
};

const MOCK_MODELS = [
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13", "iPhone 12", "iPhone 11"
];

const TradeInCalculator: React.FC = () => {
    const [state, setState] = useState<TradeInState>(INITIAL_STATE);
    const [results, setResults] = useState({
        purchaseValue: 0, // How much we pay for the used phone
        differenceToPay: 0, // New Device - Purchase Value
        deductions: 0
    });
    const [saving, setSaving] = useState(false);

    // --- Calculation Logic ---

    useEffect(() => {
        calculateTradeIn();
    }, [state]);

    const calculateTradeIn = () => {
        const {
            usedDeviceMarketValue,
            grade,
            batteryBad,
            defects,
            newDevicePrice
        } = state;

        if (!usedDeviceMarketValue) {
            setResults({ purchaseValue: 0, differenceToPay: newDevicePrice, deductions: 0 });
            return;
        }

        // 1. Apply Grade Multiplier to Base Market Value
        let value = usedDeviceMarketValue * CONFIG.GRADE_MULTIPLIER[grade];

        // 2. Apply Safety Margin (Profit)
        // Formula: Value after Grade - (Value after Grade * Margin)
        // Or: Value based on (Market - Margin) then Grade? 
        // Prompt says: "Valor de Mercado - 25% - Custos de Reparo" but also mentions Grade.
        // Let's assume Grade affects the "perceived market condition" first.

        // Applying margin first is safer for business:
        // Base = Market * (1 - Margin)
        // Then adjust for condition (Grade & Defects)

        // However, Grade usually implies cosmetic condition which lowers market value effectively.
        // Let's stick to a robust formula:
        // Base Valuation = Market Value * GradeMultiplier
        // Net Offer = Base Valuation * (1 - SafetyMargin) - Repair Costs

        const baseValuation = usedDeviceMarketValue * CONFIG.GRADE_MULTIPLIER[grade];
        const valueAfterMargin = baseValuation * (1 - CONFIG.SAFETY_MARGIN_PERCENT);

        // 3. Calculate Deductions
        let totalDeductions = 0;
        if (batteryBad) totalDeductions += CONFIG.BATTERY_DEDUCTION;
        if (defects.faceId) totalDeductions += CONFIG.REPAIR_COSTS.faceId;
        if (defects.screen) totalDeductions += CONFIG.REPAIR_COSTS.screen;
        if (defects.camera) totalDeductions += CONFIG.REPAIR_COSTS.camera;
        if (defects.backGlass) totalDeductions += CONFIG.REPAIR_COSTS.backGlass;

        const finalOffer = Math.max(0, valueAfterMargin - totalDeductions);
        const diff = Math.max(0, newDevicePrice - finalOffer);

        setResults({
            purchaseValue: finalOffer,
            differenceToPay: diff,
            deductions: totalDeductions
        });
    };

    const handleDefectChange = (key: keyof typeof state.defects) => {
        setState(prev => ({
            ...prev,
            defects: { ...prev.defects, [key]: !prev.defects[key] }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                new_device_model: state.newDeviceModel,
                new_device_price: state.newDevicePrice,
                used_device_model: state.usedDeviceModel,
                used_device_details: {
                    capacity: state.usedDeviceCapacity,
                    grade: state.grade,
                    battery_bad: state.batteryBad,
                    defects: state.defects
                },
                market_value: state.usedDeviceMarketValue,
                offer_value: results.purchaseValue,
                difference: results.differenceToPay,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('trade_in_simulations')
                .insert([payload]);

            if (error) {
                // If table doesn't exist, this will fail. We'll show an alert for now.
                console.error('Save error:', error);
                alert('Erro ao salvar simulação! Verifique se a tabela "trade_in_simulations" existe.');
            } else {
                alert('Simulação salva com sucesso!');
            }
        } catch (err) {
            console.error(err);
            alert('Erro inesperado.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 animate-in fade-in duration-300">

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                        <RefreshCcw className="text-blue-400" />
                        Trade-in Inteligente
                    </h1>
                    <p className="text-slate-400 mt-1">Simulador de avaliação e troca de aparelhos</p>
                </div>

                <button
                    onClick={() => setState(INITIAL_STATE)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <RotateCcw size={16} />
                    Nova Simulação
                </button>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN - INPUTS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. New Device Section */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-blue-300 flex items-center gap-2">
                            <Smartphone size={20} />
                            Aparelho Novo (Venda)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Modelo Desejado</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        value={state.newDeviceModel}
                                        onChange={(e) => setState({ ...state, newDeviceModel: e.target.value })}
                                    >
                                        <option value="">Selecione um modelo...</option>
                                        {MOCK_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <Search size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Valor de Venda (R$)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                                    placeholder="0.00"
                                    value={state.newDevicePrice || ''}
                                    onChange={(e) => setState({ ...state, newDevicePrice: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Used Device Section */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                            <RefreshCcw size={20} />
                            Aparelho Usado (Entrada)
                        </h2>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-400 mb-1">Modelo do Cliente</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Ex: iPhone 12 Pro"
                                    value={state.usedDeviceModel}
                                    onChange={(e) => setState({ ...state, usedDeviceModel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Capacidade</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={state.usedDeviceCapacity}
                                    onChange={(e) => setState({ ...state, usedDeviceCapacity: e.target.value })}
                                >
                                    <option>64GB</option>
                                    <option>128GB</option>
                                    <option>256GB</option>
                                    <option>512GB</option>
                                    <option>1TB</option>
                                </select>
                            </div>
                        </div>

                        {/* Valuation Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Valor de Mercado (Usado)
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-lg transition-all group-hover:border-slate-600"
                                        placeholder="0.00"
                                        value={state.usedDeviceMarketValue || ''}
                                        onChange={(e) => setState({ ...state, usedDeviceMarketValue: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Preço médio de venda deste aparelho usado.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Grade Estética</label>
                                <div className="flex gap-2">
                                    {(['A', 'B', 'C'] as Grade[]).map((gradeOption) => (
                                        <button
                                            key={gradeOption}
                                            onClick={() => setState({ ...state, grade: gradeOption })}
                                            className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${state.grade === gradeOption
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                                                }`}
                                        >
                                            {gradeOption}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {state.grade === 'A' ? 'Sem detalhes (100%)' : state.grade === 'B' ? 'Pequenos riscos (90%)' : 'Marcas visíveis (80%)'}
                                </p>
                            </div>
                        </div>

                        {/* Conditions & Defects */}
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                            <label className="block text-sm font-bold text-slate-300 mb-4 px-1">
                                Condições & Avarias
                            </label>

                            <div className="space-y-3">
                                {/* Battery */}
                                <label className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${state.batteryBad ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${state.batteryBad ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                            <Battery size={18} />
                                        </div>
                                        <div>
                                            <span className={`font-medium ${state.batteryBad ? 'text-red-300' : 'text-slate-300'}`}>Saúde da Bateria &lt; 80%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="accent-red-500 w-5 h-5"
                                        checked={state.batteryBad}
                                        onChange={() => setState({ ...state, batteryBad: !state.batteryBad })}
                                    />
                                </label>

                                {/* Other Defects */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { key: 'faceId', label: 'FaceID Falhando', cost: CONFIG.REPAIR_COSTS.faceId },
                                        { key: 'screen', label: 'Tela Quebrada', cost: CONFIG.REPAIR_COSTS.screen },
                                        { key: 'camera', label: 'Câmera Ruins', cost: CONFIG.REPAIR_COSTS.camera },
                                        { key: 'backGlass', label: 'Traseira Trincada', cost: CONFIG.REPAIR_COSTS.backGlass },
                                    ].map((defect) => (
                                        <label
                                            key={defect.key}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${state.defects[defect.key as keyof typeof state.defects]
                                                    ? 'bg-orange-500/10 border-orange-500/50'
                                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <span className={`font-medium ${state.defects[defect.key as keyof typeof state.defects] ? 'text-orange-300' : 'text-slate-300'}`}>
                                                {defect.label}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500">-R$ {defect.cost}</span>
                                                <input
                                                    type="checkbox"
                                                    className="accent-orange-500 w-4 h-4"
                                                    checked={state.defects[defect.key as keyof typeof state.defects]}
                                                    onChange={() => handleDefectChange(defect.key as keyof typeof state.defects)}
                                                />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - SUMMARY CARD */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                            <h3 className="text-lg font-bold text-slate-300 mb-6 flex items-center">
                                <Calculator size={18} className="mr-2 text-green-400" />
                                Resumo da Negociação
                            </h3>

                            <div className="space-y-6 relative z-10">

                                {/* 1. Value Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Valor Aparelho Novo</span>
                                        <span className="text-slate-200">R$ {state.newDevicePrice.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-purple-300">Avaliação do Usado (Bruta)</span>
                                        <span className="text-purple-300">
                                            R$ {(state.usedDeviceMarketValue * CONFIG.GRADE_MULTIPLIER[state.grade]).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-red-400/80 pl-2 border-l-2 border-red-500/20">
                                        <span>Margem de Segurança (25%)</span>
                                        <span>- R$ {(state.usedDeviceMarketValue * CONFIG.GRADE_MULTIPLIER[state.grade] * CONFIG.SAFETY_MARGIN_PERCENT).toFixed(2)}</span>
                                    </div>

                                    {results.deductions > 0 && (
                                        <div className="flex justify-between text-xs text-orange-400/80 pl-2 border-l-2 border-orange-500/20">
                                            <span>Reparos & Bateria</span>
                                            <span>- R$ {results.deductions.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="h-px bg-slate-700 my-2"></div>

                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                        <span className="text-sm font-bold text-green-400">Pagar no Usado</span>
                                        <span className="text-xl font-bold text-green-400">
                                            R$ {results.purchaseValue.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Final Result */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg transform transition-all hover:scale-[1.02]">
                                    <p className="text-blue-100 text-sm font-medium mb-1 opacity-80">Diferença a Pagar</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-blue-200">R$</span>
                                        <span className="text-4xl font-bold text-white tracking-tight">
                                            {results.differenceToPay.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-200 mt-2 opacity-70">
                                        (Novo - Usado Avaliado)
                                    </p>
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !state.usedDeviceMarketValue}
                                    className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></span>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Salvar Simulação
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Hint */}
                        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3">
                            <ShieldAlert className="text-yellow-500 shrink-0" size={20} />
                            <p className="text-xs text-yellow-200/80 leading-relaxed">
                                Atenção: Sempre verifique o IMEI e iCloud do aparelho usado antes de finalizar a troca. Esta calculadora é apenas uma estimativa.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeInCalculator;
