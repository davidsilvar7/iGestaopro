import { InventoryItem, ItemCategory, ServiceSubtype, DeviceCondition, Transaction, OSStatus, ServiceOrder } from '../types';

// Helper para gerar IDs únicos
const uid = () => Math.random().toString(36).substr(2, 9);

// --- TABELA DE PREÇOS DE TELAS (Catálogo de Serviços) ---
const screenPrices = [
  { model: 'iPhone 11', paralela: 170, premium: 280 },
  { model: 'iPhone 11 Pro', paralela: 185, premium: 420 },
  { model: 'iPhone 11 Pro Max', paralela: 200, premium: 480 },
  { model: 'iPhone 12', paralela: 200, premium: 520 },
  { model: 'iPhone 12 Pro', paralela: 200, premium: 520 },
  { model: 'iPhone 12 Pro Max', paralela: 220, premium: 720 },
  { model: 'iPhone 13', paralela: 280, premium: 580 },
  { model: 'iPhone 13 Pro', paralela: 310, premium: 720 },
  { model: 'iPhone 13 Pro Max', paralela: 320, premium: 820 },
  { model: 'iPhone 14', paralela: 280, premium: 690 },
  { model: 'iPhone 14 Pro', paralela: 310, premium: 1190 },
  { model: 'iPhone 14 Pro Max', paralela: 470, premium: 1050 },
  { model: 'iPhone 15', paralela: 390, premium: 1290 },
  { model: 'iPhone 15 Pro Max', paralela: 510, premium: 1350 },
  { model: 'iPhone 16', paralela: 590, premium: 1540 },
  { model: 'iPhone 16 Pro', paralela: 980, premium: 1890 },
  { model: 'iPhone 16 Pro Max', paralela: 990, premium: 1990 },
];

// Gerador de serviços de tela
const screenServices: InventoryItem[] = [];
screenPrices.forEach(item => {
  screenServices.push({
    id: uid(),
    category: ItemCategory.SERVICE,
    serviceSubtype: ServiceSubtype.SCREEN,
    name: `Tela ${item.model}`,
    sku: `TELA-${item.model.replace(/\s/g, '').toUpperCase()}-PAR`,
    costPrice: Math.round(item.paralela * 0.5),
    sellPrice: item.paralela,
    quantity: 9999,
    serviceType: 'PARALELA',
    minStockLevel: 0
  });
  screenServices.push({
    id: uid(),
    category: ItemCategory.SERVICE,
    serviceSubtype: ServiceSubtype.SCREEN,
    name: `Tela ${item.model}`,
    sku: `TELA-${item.model.replace(/\s/g, '').toUpperCase()}-PREM`,
    costPrice: Math.round(item.premium * 0.45),
    sellPrice: item.premium,
    quantity: 9999,
    serviceType: 'PREMIUM',
    minStockLevel: 0
  });
});

// --- BATERIAS ---
const batteryServicesIphone: InventoryItem[] = [
  { model: 'iPhone 11', cost: 80, sell: 250 },
  { model: 'iPhone 12/12 Pro', cost: 90, sell: 290 },
  { model: 'iPhone 13', cost: 120, sell: 350 },
  { model: 'iPhone 14', cost: 150, sell: 450 },
].map(item => ({
  id: uid(),
  category: ItemCategory.SERVICE,
  serviceSubtype: ServiceSubtype.BATTERY,
  name: `Bateria ${item.model}`,
  sku: `BAT-${item.model.replace(/\s|[/]/g, '').toUpperCase()}`,
  costPrice: item.cost,
  sellPrice: item.sell,
  quantity: 9999,
  serviceType: 'PREMIUM', 
  minStockLevel: 0
}));

const batteryServicesAndroid: InventoryItem[] = [
  { model: 'Xiaomi Redmi Note', cost: 60, sell: 180 },
  { model: 'Poco X Séries', cost: 70, sell: 220 },
  { model: 'Samsung A Séries', cost: 55, sell: 160 },
].map(item => ({
  id: uid(),
  category: ItemCategory.SERVICE,
  serviceSubtype: ServiceSubtype.BATTERY,
  name: `Bateria ${item.model}`,
  sku: `BAT-AND-${item.model.split(' ')[0].toUpperCase()}`,
  costPrice: item.cost,
  sellPrice: item.sell,
  quantity: 9999,
  serviceType: 'OUTROS',
  minStockLevel: 0
}));

// --- DEFINIÇÃO DOS MODELOS FÍSICOS (TEMPLATES ZERADOS) ---

// 1. iPhones (Seminovos)
const iphoneModelsList = [
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max"
];

const initialIphones: InventoryItem[] = iphoneModelsList.map(model => ({
  id: uid(),
  category: ItemCategory.IPHONE,
  name: model,
  sku: `IPH-${model.replace(/\s/g, '').toUpperCase()}-TEMPLATE`,
  storage: '128GB', // Padrão sugerido, editável
  condition: DeviceCondition.USED_LIKE_NEW, // Padrão sugerido, editável
  costPrice: 0, 
  sellPrice: 0, 
  quantity: 0, 
  minStockLevel: 1,
  observation: 'Cadastro Inicial - Ajustar Valor e Qtd'
}));

// 2. Androids (Novos)
const androidModelsList = [
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

const initialAndroids: InventoryItem[] = androidModelsList.map(model => ({
  id: uid(),
  category: ItemCategory.ANDROID,
  name: model,
  sku: `AND-${model.replace(/\s|\//g, '').toUpperCase()}`,
  condition: DeviceCondition.NEW,
  costPrice: 0, 
  sellPrice: 0, 
  quantity: 0, 
  minStockLevel: 1,
  observation: 'Novo - Ajustar Valor e Qtd'
}));


// --- INVENTÁRIO COMPLETO ---
export const mockInventory: InventoryItem[] = [
  ...initialIphones,
  ...initialAndroids,
  ...screenServices,
  ...batteryServicesIphone,
  ...batteryServicesAndroid,
];

// --- DADOS ZERADOS PARA INÍCIO DE OPERAÇÃO ---
export const mockTransactions: Transaction[] = [];
export const mockServiceOrders: ServiceOrder[] = [];

// --- HELPERS PARA MUTAÇÃO GLOBAL (Simulando Backend) ---
// Estas funções garantem que Inventory, Sales e ServiceDesk compartilhem dados na mesma sessão.

export const addTransaction = (transaction: Transaction) => {
  mockTransactions.unshift(transaction); // Adiciona no início (mais recente)
};

export const addServiceOrder = (os: ServiceOrder) => {
  mockServiceOrders.unshift(os);
};

export const addInventoryItem = (item: InventoryItem) => {
  mockInventory.unshift(item);
};
