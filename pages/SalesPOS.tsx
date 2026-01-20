import React, { useState, useEffect } from 'react';
import { fetchInventory, createTransaction, processSale } from '../services/dataService';
import { InventoryItem, ItemCategory, ServiceSubtype, Transaction } from '../types';
import { Search, ShoppingCart, Calculator, AlertTriangle, Lock, Monitor, Battery, Zap, Smartphone, Plus, Wrench, AlertCircle, CheckCircle2, Edit2 } from 'lucide-react';

interface CartItem extends InventoryItem {
  cartId: string;
}

// Quick entry modes
type POSMode = 'STOCK' | 'QUICK_SERVICE' | 'QUICK_ACCESSORY';

const SalesPOS: React.FC = () => {
  const [stock, setStock] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<POSMode>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Service/Accessory Form State
  const [quickForm, setQuickForm] = useState({
    type: '', // TELA, BATERIA, OUTRO
    brand: '', // Apple, Xiaomi
    model: '', // 11, 13 Pro
    name: '', // Descrição final
    cost: '',
    price: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Smart Calculator State
  const [discountValue, setDiscountValue] = useState(0);
  const [fixedCostsPct, setFixedCostsPct] = useState(12); // Default 12%, now editable
  const [marginStatus, setMarginStatus] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [calculatedProfit, setCalculatedProfit] = useState(0);
  const [calculatedMarginPct, setCalculatedMarginPct] = useState(0);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Totais baseados no carrinho (que agora tem preços editáveis)
  const subtotal = cart.reduce((acc, item) => acc + item.sellPrice, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.costPrice, 0);

  useEffect(() => {
    // Load fresh inventory for POS
    const loadStock = async () => {
      const data = await fetchInventory();
      setStock(data);
    };
    loadStock();
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setMarginStatus('GREEN');
      setCalculatedProfit(0);
      setCalculatedMarginPct(0);
      return;
    }

    const netSale = subtotal - discountValue;
    const operationalCosts = netSale * (fixedCostsPct / 100);
    const finalCost = totalCost + operationalCosts;
    const profit = netSale - finalCost;
    const marginPct = netSale > 0 ? (profit / netSale) * 100 : 0;

    setCalculatedProfit(profit);
    setCalculatedMarginPct(marginPct);

    if (marginPct >= 15) {
      setMarginStatus('GREEN');
      setRequiresAuth(false);
    } else if (marginPct >= 5) {
      setMarginStatus('YELLOW');
      setRequiresAuth(true);
    } else {
      setMarginStatus('RED');
      setRequiresAuth(true);
    }
  }, [cart, discountValue, fixedCostsPct, subtotal, totalCost]);

  const addToCart = (item: InventoryItem) => {
    setCart([...cart, { ...item, cartId: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(i => i.cartId !== cartId));
  };

  // Função para editar o preço diretamente no carrinho
  const updateCartItemPrice = (cartId: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    setCart(prevCart => prevCart.map(item =>
      item.cartId === cartId
        ? { ...item, sellPrice: isNaN(price) ? 0 : price }
        : item
    ));
  };

  const validateQuickForm = (category: ItemCategory): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (category === ItemCategory.SERVICE) {
      if (!quickForm.brand || quickForm.brand.trim().length < 2) {
        errors.brand = "Informe a marca e modelo (mín. 2 letras)";
        isValid = false;
      }
    }

    if (category === ItemCategory.ACCESSORY) {
      if (!quickForm.name || quickForm.name.trim().length < 3) {
        errors.name = "Descrição muito curta (mín. 3 letras)";
        isValid = false;
      }
    }

    const cost = parseFloat(quickForm.cost);
    if (quickForm.cost && (isNaN(cost) || cost < 0)) {
      errors.cost = "Custo inválido";
      isValid = false;
    }

    const price = parseFloat(quickForm.price);
    if (!quickForm.price || isNaN(price) || price <= 0) {
      errors.price = "Preço de venda obrigatório";
      isValid = false;
    }

    if (!isNaN(cost) && !isNaN(price) && price < cost) {
      errors.price = "Preço menor que custo!";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleQuickAdd = (category: ItemCategory) => {
    if (!validateQuickForm(category)) return;

    const newItem: InventoryItem = {
      id: `temp-${Date.now()}`,
      category: category,
      name: category === ItemCategory.SERVICE
        ? `${quickForm.type === 'TELA' ? 'Troca de Tela' : quickForm.type === 'BATERIA' ? 'Troca de Bateria' : 'Serviço'} - ${quickForm.brand}`
        : quickForm.name,
      sku: `QUICK-${Date.now()}`,
      costPrice: parseFloat(quickForm.cost) || 0,
      sellPrice: parseFloat(quickForm.price) || 0,
      quantity: 1
    };

    addToCart(newItem);
    setQuickForm({ ...quickForm, brand: '', name: '', cost: '', price: '' });
    setFormErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setQuickForm({ ...quickForm, [field]: value });
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (marginStatus === 'RED') {
      alert("Margem negativa! Venda bloqueada.");
      return;
    }

    // 1. Create Transaction Payload
    const transactionData: Omit<Transaction, 'id'> = {
      type: 'SALE',
      date: new Date().toISOString(),
      items: cart,
      totalAmount: subtotal - discountValue,
      totalCost: totalCost,
      totalProfit: calculatedProfit
    };

    // 2. Save to "Database" (Supabase) via Process Sale (handles stock deduction)
    const success = await processSale(transactionData, cart);

    if (success) {
      // 3. UI Feedback
      setCheckoutSuccess(true);

      // Reload stock to reflect changes immediately
      const updatedStock = await fetchInventory();
      setStock(updatedStock);

      setTimeout(() => {
        setCheckoutSuccess(false);
        setCart([]);
        setDiscountValue(0);
      }, 2000);
    } else {
      alert("Erro ao processar venda. Tente novamente.");
    }
  };

  // Filter physical items from the Database Inventory (Stock)
  const physicalInventory = stock.filter(i =>
    i.category !== ItemCategory.SERVICE &&
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans relative">

      {/* Success Overlay */}
      {checkoutSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Venda Realizada!</h2>
            <p className="text-slate-500 mt-2">Transação registrada com sucesso.</p>
          </div>
        </div>
      )}

      {/* Left Column: Product/Service Selector */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-200">

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setMode('STOCK'); setFormErrors({}); }}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center ${mode === 'STOCK' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Smartphone size={16} className="mr-2" /> Estoque (Produtos)
          </button>
          <button
            onClick={() => { setMode('QUICK_SERVICE'); setFormErrors({}); }}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center ${mode === 'QUICK_SERVICE' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Wrench size={16} className="mr-2" /> Lançar Serviço
          </button>
          <button
            onClick={() => { setMode('QUICK_ACCESSORY'); setFormErrors({}); }}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center ${mode === 'QUICK_ACCESSORY' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Zap size={16} className="mr-2" /> Acessório Avulso
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">

          {/* MODE: STOCK (Existing Inventory) */}
          {mode === 'STOCK' && (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar iPhones, Capas, Películas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {physicalInventory.length === 0 && (
                  <div className="col-span-full text-center py-10 text-slate-400">
                    <p>Nenhum produto cadastrado com esse nome.</p>
                    <p className="text-sm">Cadastre novos itens no menu Estoque.</p>
                  </div>
                )}
                {physicalInventory.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-xs font-mono text-slate-400">{item.sku}</span>
                      <h4 className="font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600">{item.name}</h4>
                      {item.imei && <span className="text-xs bg-slate-100 px-1 rounded text-slate-500">IMEI: ...{item.imei.slice(-4)}</span>}
                    </div>
                    <div className="mt-4 flex justify-between items-center w-full">
                      <span className="font-bold text-slate-700">R$ {item.sellPrice.toFixed(2)}</span>
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                        <Plus size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* MODE: QUICK SERVICE (Wizard) */}
          {mode === 'QUICK_SERVICE' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Registrar Serviço (OS)</h2>
                <p className="text-slate-500">Selecione o tipo, informe o modelo e os valores.</p>
              </div>

              {/* Step 1: Type Selection */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'TELA', label: 'Troca de Tela', icon: Monitor },
                  { id: 'BATERIA', label: 'Troca de Bateria', icon: Battery },
                  { id: 'OUTRO', label: 'Outro Reparo', icon: Wrench },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setQuickForm({ ...quickForm, type: type.id, name: type.label })}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${quickForm.type === type.id
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-slate-200 hover:border-purple-200 text-slate-500'
                      }`}
                  >
                    <type.icon size={28} className="mb-2" />
                    <span className="font-bold text-sm">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Step 2: Details & Price */}
              {quickForm.type && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Qual Aparelho? (Marca e Modelo)</label>
                    <input
                      type="text"
                      placeholder="Ex: iPhone 11 Pro, Xiaomi Redmi Note 10..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.brand ? 'border-red-500' : 'border-slate-300'}`}
                      value={quickForm.brand}
                      onChange={e => handleInputChange('brand', e.target.value)}
                    />
                    {formErrors.brand && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {formErrors.brand}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custo da Peça (R$)</label>
                      <input
                        type="number"
                        placeholder="0,00"
                        min="0"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.cost ? 'border-red-500' : 'border-slate-300'}`}
                        value={quickForm.cost}
                        onChange={e => handleInputChange('cost', e.target.value)}
                      />
                      {formErrors.cost && <p className="text-red-500 text-xs mt-1">{formErrors.cost}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Cobrado (R$)</label>
                      <input
                        type="number"
                        placeholder="0,00"
                        min="0"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-800 ${formErrors.price ? 'border-red-500' : 'border-slate-300'}`}
                        value={quickForm.price}
                        onChange={e => handleInputChange('price', e.target.value)}
                      />
                      {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickAdd(ItemCategory.SERVICE)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center"
                  >
                    <Plus size={20} className="mr-2" /> Adicionar Serviço à Venda
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE: QUICK ACCESSORY */}
          {mode === 'QUICK_ACCESSORY' && (
            <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Venda de Acessório Avulso</h2>
                <p className="text-sm text-slate-500">Para itens que não estão cadastrados no estoque.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição do Item</label>
                  <input
                    type="text"
                    placeholder="Ex: Capinha Colorida, Cabo Genérico..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${formErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                    value={quickForm.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custo (Opcional)</label>
                    <input
                      type="number"
                      placeholder="0,00"
                      min="0"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${formErrors.cost ? 'border-red-500' : 'border-slate-300'}`}
                      value={quickForm.cost}
                      onChange={e => handleInputChange('cost', e.target.value)}
                    />
                    {formErrors.cost && <p className="text-red-500 text-xs mt-1">{formErrors.cost}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Venda</label>
                    <input
                      type="number"
                      placeholder="0,00"
                      min="0"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 ${formErrors.price ? 'border-red-500' : 'border-slate-300'}`}
                      value={quickForm.price}
                      onChange={e => handleInputChange('price', e.target.value)}
                    />
                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                </div>

                <button
                  onClick={() => handleQuickAdd(ItemCategory.ACCESSORY)}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Column: Cart & Calculator */}
      <div className="w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full z-10">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <ShoppingCart className="mr-2" size={20} /> Carrinho Atual
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">
              <p>Carrinho vazio</p>
              <p className="text-sm">Selecione itens ou serviços</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center">
                    {item.category === ItemCategory.SERVICE && <Wrench size={12} className="mr-1 text-purple-500" />}
                    {item.category === ItemCategory.ACCESSORY && item.id.startsWith('temp') && <Zap size={12} className="mr-1 text-orange-500" />}
                    <p className="font-medium text-slate-800 truncate text-sm">{item.name}</p>
                  </div>
                  {/* Price Editor in Cart */}
                  <div className="flex items-center mt-1 group-hover:bg-white rounded transition-colors">
                    <span className="text-xs text-slate-400 mr-1">R$</span>
                    <input
                      type="number"
                      className="w-20 text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 font-medium text-slate-600 border border-transparent hover:border-slate-200 focus:border-blue-300"
                      value={item.sellPrice}
                      onChange={(e) => updateCartItemPrice(item.cartId, e.target.value)}
                    />
                    <Edit2 size={10} className="text-slate-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        {/* Smart Calculator Section */}
        <div className="p-6 bg-slate-900 text-white rounded-t-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-slate-300 text-sm">
              <Calculator size={14} className="mr-1" /> Calculadora Inteligente
            </div>

            {/* Editable Fixed Cost */}
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-500">Custo Op.(%):</label>
              <input
                type="number"
                min="0"
                value={fixedCostsPct}
                onChange={(e) => setFixedCostsPct(Number(e.target.value))}
                className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-center text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Subtotal (Editável):</span>
              <span className="font-mono font-bold text-lg">R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-slate-400 text-sm">Desc. Extra (Geral):</label>
              <div className="flex items-center w-28 border-b border-slate-700">
                <span className="text-slate-500 mr-1">R$</span>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="bg-transparent w-full text-right focus:outline-none text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700 flex justify-between items-end">
              <div>
                <span className="text-sm text-slate-400 block">Total Final</span>
                <span className="text-2xl font-bold">R$ {(subtotal - discountValue).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Traffic Light Logic */}
          <div className={`p-4 rounded-xl border ${marginStatus === 'GREEN' ? 'bg-green-900/30 border-green-700' :
            marginStatus === 'YELLOW' ? 'bg-yellow-900/30 border-yellow-700' :
              'bg-red-900/30 border-red-700'
            } transition-all duration-300`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold text-sm ${marginStatus === 'GREEN' ? 'text-green-400' :
                marginStatus === 'YELLOW' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                {marginStatus === 'GREEN' ? 'Margem Saudável' :
                  marginStatus === 'YELLOW' ? 'Atenção: Margem Mínima' :
                    'Prejuízo Iminente'}
              </span>
              {requiresAuth && <Lock size={14} className="text-white opacity-70" />}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs opacity-80">
              <div>
                <span className="block text-slate-400">Lucro Real</span>
                <span className="font-mono">R$ {calculatedProfit.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-slate-400">Margem %</span>
                <span className="font-mono">{calculatedMarginPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={marginStatus === 'RED' || cart.length === 0}
            className={`w-full mt-5 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${marginStatus === 'RED' || cart.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
              requiresAuth ? 'bg-yellow-600 hover:bg-yellow-500 text-white' :
                'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            {requiresAuth && marginStatus !== 'RED' ? 'Solicitar Autorização' : 'Finalizar Venda'}
          </button>

          {marginStatus === 'RED' && (
            <p className="text-center text-xs text-red-400 mt-2">Venda bloqueada devido a prejuízo.</p>
          )}

        </div>
      </div>
    </div>
  );
};

export default SalesPOS;