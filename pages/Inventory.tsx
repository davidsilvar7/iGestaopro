import React, { useState, useEffect } from 'react';
import { fetchInventory, createInventoryItem, updateInventoryItem } from '../services/dataService';
import { ItemCategory, InventoryItem, DeviceCondition } from '../types';
import { Search, Plus, Filter, ChevronDown, ChevronUp, Smartphone, Zap, Package, DollarSign, X, Save, TrendingUp, AlertCircle } from 'lucide-react';

// Constantes atualizadas conforme solicitação
const IPHONE_MODELS = [
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max"
];

const IPHONE_STORAGE = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const ANDROID_MODELS = [
  "Redmi A5 4/128",
  "Redmi 13X 8/256",
  "Redmi 15",
  "Redmi 15C",
  "Poco C71 4/128",
  "Poco C85",
  "Poco M7 Pro 5G",
  "Poco X7 12/512",
  "Poco X7 Pro 5G",
  "Redmi Note 14 5G",
  "Redmi Note 14 Pro 5G",
  "Realme Note 60X"
];

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: ItemCategory.IPHONE,
    name: '',
    sku: '',
    costPrice: 0,
    sellPrice: 0,
    quantity: 1,
    condition: DeviceCondition.USED_LIKE_NEW,
    observation: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await fetchInventory();
    setItems(data);
    setLoading(false);
  };

  // Filter out Services from Inventory View - Show only Physical Goods
  const physicalItems = items.filter(item => item.category !== ItemCategory.SERVICE);

  const filteredItems = physicalItems.filter(item => {
    // 1. Primary Filter (Category)
    let matchesType = false;
    if (filter === 'ALL') {
      matchesType = true;
    } else {
      matchesType = item.category === filter;
    }

    // 2. Search
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term);

    return matchesType && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePriceChange = async (id: string, field: 'costPrice' | 'sellPrice', value: string) => {
    const numValue = parseFloat(value);
    const safeValue = isNaN(numValue) ? 0 : numValue;

    // Update locally immediately for responsiveness
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: safeValue };
      }
      return item;
    }));

    // Update in Supabase
    await updateInventoryItem(id, { [field]: safeValue });
  };

  const handleQuantityChange = async (id: string, value: string) => {
    const numValue = parseInt(value);
    const safeValue = isNaN(numValue) ? 0 : numValue;

    // Update locally
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: safeValue };
      }
      return item;
    }));

    // Update in Supabase
    await updateInventoryItem(id, { quantity: safeValue });
  };

  const handleNewItemChange = (field: keyof InventoryItem, value: any) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Common validations
    if (!newItem.name || newItem.name.trim() === '') {
      newErrors.name = 'O nome/modelo do produto é obrigatório.';
      isValid = false;
    }

    if (newItem.costPrice === undefined || newItem.costPrice < 0) {
      newErrors.costPrice = 'O custo não pode ser negativo.';
      isValid = false;
    }

    if (newItem.sellPrice === undefined || newItem.sellPrice <= 0) {
      newErrors.sellPrice = 'O preço de venda deve ser maior que zero.';
      isValid = false;
    }

    if (newItem.sellPrice !== undefined && newItem.costPrice !== undefined && newItem.sellPrice < newItem.costPrice) {
      newErrors.sellPrice = 'Atenção: Preço de venda menor que o custo.';
      isValid = false;
    }

    if (newItem.quantity === undefined || newItem.quantity < 0) {
      newErrors.quantity = 'Quantidade inválida.';
      isValid = false;
    }

    // Category Specific
    if (newItem.category === ItemCategory.IPHONE) {
      if (!newItem.storage) {
        newErrors.storage = 'Selecione a capacidade de armazenamento.';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const itemToSave: Omit<InventoryItem, 'id'> = {
      category: newItem.category || ItemCategory.IPHONE,
      name: newItem.name || '',
      sku: newItem.sku || `SKU-${Date.now().toString().substr(-6)}`,
      costPrice: Number(newItem.costPrice) || 0,
      sellPrice: Number(newItem.sellPrice) || 0,
      quantity: Number(newItem.quantity) || 0,
      condition: newItem.condition,
      storage: newItem.storage,
      serviceType: newItem.serviceType as any,
      serviceSubtype: newItem.serviceSubtype,
      observation: newItem.observation,
      imei: newItem.imei
    };

    const savedItem = await createInventoryItem(itemToSave);

    if (savedItem) {
      setItems([savedItem, ...items]);
      setIsModalOpen(false);

      // Reset form
      setNewItem({
        category: ItemCategory.IPHONE,
        name: '',
        sku: '',
        costPrice: 0,
        sellPrice: 0,
        quantity: 1,
        condition: DeviceCondition.USED_LIKE_NEW,
        observation: '',
        imei: ''
      });
      setErrors({});
    } else {
      alert("Erro ao salvar produto. Verifique a conexão com o banco de dados.");
    }
  };

  const getCategoryIcon = (item: InventoryItem) => {
    switch (item.category) {
      case ItemCategory.IPHONE: return <Smartphone className="text-slate-800" size={18} />;
      case ItemCategory.ANDROID: return <Smartphone className="text-green-600" size={18} />;
      case ItemCategory.ANDROID_USED: return <Smartphone className="text-green-800" size={18} />;
      case ItemCategory.ACCESSORY: return <Zap className="text-yellow-600" size={18} />;
      default: return <Package className="text-slate-400" size={18} />;
    }
  };

  const calculateMargin = (cost: number, sell: number) => {
    if (sell === 0) return 0;
    return ((sell - cost) / sell) * 100;
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque Físico</h1>
          <p className="text-slate-500">Gestão de Smartphones e Acessórios Cadastrados.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setErrors({});
              setNewItem({
                category: ItemCategory.IPHONE,
                name: '',
                costPrice: 0,
                sellPrice: 0,
                quantity: 1,
                condition: DeviceCondition.USED_LIKE_NEW
              });
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} className="mr-2" /> Novo Produto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar (iPhone 13, Capinha, SKU...)"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'Tudo' },
                { id: ItemCategory.IPHONE, label: 'iPhones' },
                { id: ItemCategory.ANDROID, label: 'And. Novos' },
                { id: ItemCategory.ANDROID_USED, label: 'And. Seminovos' },
                { id: ItemCategory.ACCESSORY, label: 'Acessórios' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === tab.id
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Detalhes</th>
                <th className="px-6 py-4 text-center">Qtd.</th>
                <th className="px-6 py-4 text-right">Custo</th>
                <th className="px-6 py-4 text-right">Venda</th>
                <th className="px-6 py-4 text-right">Lucro</th>
                <th className="px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center flex-col items-center">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p>Carregando estoque...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const margin = calculateMargin(item.costPrice, item.sellPrice);
                  const profit = item.sellPrice - item.costPrice;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleExpand(item.id)}
                        className={`cursor-pointer transition-colors ${expandedId === item.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-slate-100 mr-3">
                              {getCategoryIcon(item)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{item.name}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                {item.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                              {item.storage && <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">{item.storage}</span>}
                              {item.condition && <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium truncate max-w-[100px]">{item.condition}</span>}
                            </div>
                            {item.observation && (
                              <span className="text-xs text-slate-400 italic truncate max-w-[200px]">
                                Obs: {item.observation}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-semibold ${item.quantity === 0 ? 'text-orange-500' : 'text-slate-700'}`}>
                            {item.quantity === 0 ? 'Sob Pedido' : item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 font-mono">
                          R$ {item.costPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900 font-mono">
                          R$ {item.sellPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              R$ {profit.toFixed(2)}
                            </span>
                            <span className={`text-xs px-1.5 rounded ${margin >= 20 ? 'bg-green-100 text-green-700' : margin >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {margin.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-400">
                          {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </td>
                      </tr>

                      {/* Expanded Pricing Editor */}
                      {expandedId === item.id && (
                        <tr className="bg-indigo-50/30 border-b border-indigo-100 animate-in fade-in slide-in-from-top-2">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col lg:flex-row gap-6 items-center">

                              <div className="flex-1 space-y-2">
                                <h4 className="font-semibold text-slate-800 flex items-center">
                                  <TrendingUp size={16} className="mr-2 text-indigo-600" />
                                  Gestão de Lucro & Estoque
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Atualize os preços e a quantidade disponível.
                                </p>
                                {item.observation && (
                                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                    <strong>Observações:</strong> {item.observation}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {/* Quantity Editor Added Here */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Qtd.</label>
                                  <div className="relative mt-1">
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                      className="w-16 pl-2 pr-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm text-center"
                                    />
                                  </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200 mx-1"></div>

                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Custo (R$)</label>
                                  <div className="relative mt-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                                    <input
                                      type="number"
                                      value={item.costPrice}
                                      onChange={(e) => handlePriceChange(item.id, 'costPrice', e.target.value)}
                                      className="w-28 pl-6 pr-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="text-slate-400 pb-2">➔</div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Venda (R$)</label>
                                  <div className="relative mt-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                                    <input
                                      type="number"
                                      value={item.sellPrice}
                                      onChange={(e) => handlePriceChange(item.id, 'sellPrice', e.target.value)}
                                      className="w-28 pl-6 pr-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 font-mono text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 w-full lg:w-auto">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-500 font-medium">Margem</span>
                                  <span className={`text-sm font-bold ${margin >= 30 ? 'text-green-600' : 'text-yellow-600'}`}>R$ {profit.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${margin >= 20 ? 'bg-green-500' : margin >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium">Nenhum produto físico encontrado nesta categoria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Item Modal (Only for Physical Items) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Novo Produto Físico</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form id="new-item-form" onSubmit={handleSaveNewItem} className="space-y-5">
                {/* ... (Conteúdo do Form mantido) ... */}
                {/* Category Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Selecione a Categoria</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[ItemCategory.IPHONE, ItemCategory.ANDROID, ItemCategory.ANDROID_USED, ItemCategory.ACCESSORY].map(cat => (
                      <div
                        key={cat}
                        onClick={() => handleNewItemChange('category', cat)}
                        className={`cursor-pointer border rounded-lg p-3 text-center transition-all text-sm font-medium ${newItem.category === cat
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                      >
                        {cat === ItemCategory.IPHONE ? 'iPhone (Seminovo)' :
                          cat === ItemCategory.ANDROID ? 'Android (Novo)' :
                            cat === ItemCategory.ANDROID_USED ? 'Android (Seminovo)' :
                              'Acessórios'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* 1. IPHONE SPECIFIC FIELDS */}
                  {newItem.category === ItemCategory.IPHONE && (
                    <>
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Modelo iPhone <span className="text-red-500">*</span>
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                          value={newItem.name}
                          onChange={e => handleNewItemChange('name', e.target.value)}
                        >
                          <option value="">Selecione o Modelo...</option>
                          {IPHONE_MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                        {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.name}</p>}
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Capacidade <span className="text-red-500">*</span>
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.storage ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                          value={newItem.storage || ''}
                          onChange={e => handleNewItemChange('storage', e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {IPHONE_STORAGE.map(gb => (
                            <option key={gb} value={gb}>{gb}</option>
                          ))}
                        </select>
                        {errors.storage && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.storage}</p>}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                        <select
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={newItem.condition || DeviceCondition.USED_LIKE_NEW}
                          onChange={e => handleNewItemChange('condition', e.target.value)}
                        >
                          <option value={DeviceCondition.USED_LIKE_NEW}>Seminovo (Impecável)</option>
                          <option value={DeviceCondition.USED_GOOD}>Seminovo (Marcas de Uso)</option>
                          <option value={DeviceCondition.USED_FAIR}>Seminovo (Vitrine)</option>
                          <option value={DeviceCondition.NEW}>Novo (Lacrado)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* 2. ANDROID NEW SPECIFIC FIELDS */}
                  {newItem.category === ItemCategory.ANDROID && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Modelo Android (Novo) <span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                        value={newItem.name}
                        onChange={e => handleNewItemChange('name', e.target.value)}
                      >
                        <option value="">Selecione o Modelo...</option>
                        {ANDROID_MODELS.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                      {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.name}</p>}
                    </div>
                  )}

                  {/* 3. ANDROID USED (NEW CATEGORY) SPECIFIC FIELDS */}
                  {newItem.category === ItemCategory.ANDROID_USED && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Modelo Android (Seminovo) - Digite o Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Samsung S22 Ultra, Moto G200..."
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                          value={newItem.name}
                          onChange={e => handleNewItemChange('name', e.target.value)}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.name}</p>}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                        <select
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={newItem.condition || DeviceCondition.USED_LIKE_NEW}
                          onChange={e => handleNewItemChange('condition', e.target.value)}
                        >
                          <option value={DeviceCondition.USED_LIKE_NEW}>Seminovo (Impecável)</option>
                          <option value={DeviceCondition.USED_GOOD}>Seminovo (Marcas de Uso)</option>
                          <option value={DeviceCondition.USED_FAIR}>Seminovo (Vitrine)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* 4. ACCESSORY FIELDS (Fallback) */}
                  {newItem.category === ItemCategory.ACCESSORY && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Descrição <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Capa Silicone iPhone 13"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                        value={newItem.name}
                        onChange={e => handleNewItemChange('name', e.target.value)}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.name}</p>}
                    </div>
                  )}

                  {/* Observation Field (Common) */}
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IMEI (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 356491..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newItem.imei || ''}
                      onChange={e => handleNewItemChange('imei', e.target.value)}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações (Livre)</label>
                    <input
                      type="text"
                      placeholder="Ex: Fornecedor XYZ, Troca, Consignado..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newItem.observation || ''}
                      onChange={e => handleNewItemChange('observation', e.target.value)}
                    />
                  </div>
                </div>

                {/* Financials */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><DollarSign size={14} className="mr-1" /> Definição de Preço (Manual)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Custo de Aquisição</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          type="number"
                          min="0"
                          className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.costPrice ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                          value={newItem.costPrice}
                          onChange={e => handleNewItemChange('costPrice', e.target.value)}
                        />
                      </div>
                      {errors.costPrice && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.costPrice}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Preço de Venda</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          type="number"
                          min="0"
                          className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 ${errors.sellPrice ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                          value={newItem.sellPrice}
                          onChange={e => handleNewItemChange('sellPrice', e.target.value)}
                        />
                      </div>
                      {errors.sellPrice && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.sellPrice}</p>}
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade em Estoque</label>
                  <div className="flex items-center">
                    <Package size={18} className="text-slate-400 mr-2" />
                    <input
                      type="number"
                      min="0"
                      className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                      value={newItem.quantity}
                      onChange={e => handleNewItemChange('quantity', e.target.value)}
                    />
                    <span className="ml-3 text-xs text-slate-400 italic">Deixe 0 se for trabalhar com estoque do fornecedor.</span>
                  </div>
                  {errors.quantity && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {errors.quantity}</p>}
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancelar</button>
              <button
                type="submit"
                form="new-item-form"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg font-medium flex items-center"
              >
                <Save size={18} className="mr-2" /> Cadastrar Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;