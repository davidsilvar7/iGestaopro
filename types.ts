
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
  USED_FAIR = 'Seminovo (Vitrine)',
  TRADE_IN = 'Usado/Troca'
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
  tradeInItems?: InventoryItem[];
  tradeInTotal?: number;
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
  customerPhone?: string; // WhatsApp/Contact
  deviceModel: string;
  problemDescription: string;
  status: OSStatus;
  entryDate: string;
  total: number;
  checklist?: { [key: string]: boolean };
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // 'Aluguel', 'Energia', 'Internet', 'Pessoal', 'Outros'
  date: string;
}


// CRM Types

export type LifecycleStage = 'LEAD' | 'CLIENT';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'VISIT' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  address?: string;
  lifecycleStage: LifecycleStage;
  status: LeadStatus;
  source?: string; // Instagram, Google, Indication
  deviceOwned?: string; // Current device
  interest?: string; // Device they want to buy
  opportunityValue?: number; // Potential Deal Value
  nextAction?: string; // Next step/task (e.g. Call tomorrow)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
// Marketing Types
export interface Campaign {
  id: string;
  name: string;
  messageTemplate: string;
  filters: {
    deviceName?: string;
    lifecycleStage?: string;
    status?: string;
  };
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
}

export interface CampaignTarget {
  id: string;
  campaignId: string;
  customerId: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  customerName?: string; // Join helper
  customerPhone?: string; // Join helper
}

export interface Interaction {
  id: string;
  customerId: string;
  type: 'WHATSAPP' | 'CALL' | 'VISIT' | 'EMAIL' | 'OTHER';
  notes: string;
  date: string;
  createdBy?: string;
}

