
export enum ItemCategory {
  IPHONE = 'IPHONE',         // Seminovo/Novo (11 ao 16)
  ANDROID = 'ANDROID',       // Xiaomi/Poco/Realme (Novos)
  ANDROID_USED = 'ANDROID_USED', // Androids Seminovos (Campo Livre)
  SERVICE = 'SERVICE',       // Troca de Tela / Reparos
  ACCESSORY = 'ACCESSORY'    // Carregadores Genéricos / Cabos
}

export enum ServiceSubtype {
  SCREEN = 'SCREEN',   // Troca de Tela
  BATTERY = 'BATTERY', // Troca de Bateria
  OTHER = 'OTHER'      // Outros reparos
}

export enum DeviceCondition {
  NEW = 'Novo',
  USED_LIKE_NEW = 'Seminovo (Impecável)',
  USED_GOOD = 'Seminovo (Marcas de Uso)',
  USED_FAIR = 'Seminovo (Vitrine)'
}

export interface InventoryItem {
  id: string;
  category: ItemCategory;
  name: string; // Ex: iPhone 13 Pro 128GB ou Redmi Note 13
  sku: string;
  
  // Precificação (Coração do Sistema)
  costPrice: number;
  sellPrice: number;
  
  // Campos calculados em tempo real na UI, mas úteis aqui se persistidos
  quantity: number; // Menos relevante, mas mantido para controle básico
  minStockLevel?: number;
  
  // Específicos de Aparelhos
  storage?: string; // 64GB, 128GB...
  color?: string;
  condition?: DeviceCondition;
  imei?: string;
  observation?: string; // Campo livre (Fornecedor, Troca, etc)
  
  // Específicos de Serviços
  serviceType?: 'PREMIUM' | 'PARALELA' | 'OUTROS'; // Qualidade da peça
  serviceSubtype?: ServiceSubtype; // Categoria do serviço (Tela/Bateria)
}

export interface Transaction {
  id: string;
  type: 'SALE' | 'SERVICE' | 'EXPENSE';
  date: string;
  items: InventoryItem[]; // O que foi vendido
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
}

// Mantendo compatibilidade com OS antiga mas simplificando
export enum OSStatus {
  PENDING = 'Aguardando',
  IN_PROGRESS = 'Em Execução',
  READY = 'Pronto',
  DELIVERED = 'Entregue'
}

export interface ServiceOrder {
  id: string;
  customerName: string;
  deviceModel: string;
  problemDescription: string;
  status: OSStatus;
  entryDate: string;
  total: number;
  checklist?: { [key: string]: boolean };
}
