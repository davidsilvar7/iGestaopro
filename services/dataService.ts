
import { supabase } from './supabase';
import { InventoryItem, Transaction, ServiceOrder, Expense, Campaign, CampaignTarget, Customer } from '../types';

// --- ADAPTERS (CamelCase <-> SnakeCase) ---

const fromDbInventory = (dbItem: any): InventoryItem => ({
    id: dbItem.id,
    category: dbItem.category,
    name: dbItem.name,
    sku: dbItem.sku,
    costPrice: Number(dbItem.cost_price),
    sellPrice: Number(dbItem.sell_price),
    quantity: dbItem.quantity,
    minStockLevel: dbItem.min_stock_level,
    storage: dbItem.storage,
    color: dbItem.color,
    condition: dbItem.condition,
    imei: dbItem.imei,
    observation: dbItem.observation,
    serviceType: dbItem.service_type,
    serviceSubtype: dbItem.service_subtype
});

const toDbInventory = (item: Partial<InventoryItem>) => {
    const payload: any = {};
    if (item.category !== undefined) payload.category = item.category;
    if (item.name !== undefined) payload.name = item.name;
    if (item.sku !== undefined) payload.sku = item.sku;
    if (item.costPrice !== undefined) payload.cost_price = item.costPrice;
    if (item.sellPrice !== undefined) payload.sell_price = item.sellPrice;
    if (item.quantity !== undefined) payload.quantity = item.quantity;
    if (item.minStockLevel !== undefined) payload.min_stock_level = item.minStockLevel;
    if (item.storage !== undefined) payload.storage = item.storage;
    if (item.color !== undefined) payload.color = item.color;
    if (item.condition !== undefined) payload.condition = item.condition;
    if (item.imei !== undefined) payload.imei = item.imei;
    if (item.observation !== undefined) payload.observation = item.observation;
    if (item.serviceType !== undefined) payload.service_type = item.serviceType;
    if (item.serviceSubtype !== undefined) payload.service_subtype = item.serviceSubtype;
    return payload;
};

const fromDbTransaction = (dbItem: any): Transaction => ({
    id: dbItem.id,
    type: dbItem.type,
    date: dbItem.date,
    items: dbItem.items ? dbItem.items.map(fromDbInventory) : [], // Recursive mapping if items are stored as JSON
    totalAmount: Number(dbItem.total_amount),
    totalCost: Number(dbItem.total_cost),
    totalProfit: Number(dbItem.total_profit)
});

const toDbTransaction = (trx: Partial<Transaction>) => {
    const payload: any = {};
    if (trx.type !== undefined) payload.type = trx.type;
    if (trx.date !== undefined) payload.date = trx.date;
    if (trx.totalAmount !== undefined) payload.total_amount = trx.totalAmount;
    if (trx.totalCost !== undefined) payload.total_cost = trx.totalCost;
    if (trx.totalProfit !== undefined) payload.total_profit = trx.totalProfit;
    if (trx.items !== undefined) payload.items = trx.items.map(i => toDbInventory(i));
    return payload;
};

const fromDbServiceOrder = (dbItem: any): ServiceOrder => ({
    id: dbItem.id,
    customerName: dbItem.customer_name,
    deviceModel: dbItem.device_model,
    problemDescription: dbItem.problem_description,
    status: dbItem.status,
    entryDate: dbItem.entry_date,
    total: Number(dbItem.total),
    checklist: dbItem.checklist
});

const toDbServiceOrder = (order: Partial<ServiceOrder>) => {
    const payload: any = {};
    if (order.customerName !== undefined) payload.customer_name = order.customerName;
    if (order.deviceModel !== undefined) payload.device_model = order.deviceModel;
    if (order.problemDescription !== undefined) payload.problem_description = order.problemDescription;
    if (order.status !== undefined) payload.status = order.status;
    if (order.entryDate !== undefined) payload.entry_date = order.entryDate;
    if (order.total !== undefined) payload.total = order.total;
    if (order.checklist !== undefined) payload.checklist = order.checklist;
    return payload;
};

// --- Inventory Operations ---

export const fetchInventory = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
    return data.map(fromDbInventory);
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem | null> => {
    const payload = toDbInventory(item);
    const { data, error } = await supabase
        .from('inventory')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating item:', error);
        return null;
    }
    return fromDbInventory(data);
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
    const payload = toDbInventory(updates);
    const { data, error } = await supabase
        .from('inventory')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating item:', error);
        return null;
    }
    return fromDbInventory(data);
};

export const deleteInventoryItem = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting item:', error);
        return false;
    }
    return true;
};

// --- Transactions Operations ---

export const fetchTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    return data.map(fromDbTransaction);
};

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    const payload = toDbTransaction(transaction);
    const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating transaction:', error);
        return null;
    }
    return fromDbTransaction(data);
};

export const processSale = async (transaction: Omit<Transaction, 'id'>, itemsToDeduct: InventoryItem[]): Promise<boolean> => {
    // 1. Create Transaction
    const newTransaction = await createTransaction(transaction);

    if (!newTransaction) {
        console.error("Failed to create transaction");
        return false;
    }

    // 2. Update Inventory Quantities
    const updates = itemsToDeduct.map(async (item) => {
        if (item.id.startsWith('temp-')) return;

        const { data: currentDbItem } = await supabase.from('inventory').select('quantity').eq('id', item.id).single();

        if (currentDbItem) {
            await supabase
                .from('inventory')
                .update({ quantity: Math.max(0, currentDbItem.quantity - 1) })
                .eq('id', item.id);
        }
    });

    await Promise.all(updates);
    return true;
};

// --- Service Orders Operations ---

export const fetchServiceOrders = async (): Promise<ServiceOrder[]> => {
    const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('entry_date', { ascending: false });

    if (error) {
        console.error('Error fetching service orders:', error);
        return [];
    }
    return data.map(fromDbServiceOrder);
};

export const createServiceOrder = async (order: Omit<ServiceOrder, 'id'>): Promise<ServiceOrder | null> => {
    const payload = toDbServiceOrder(order);
    const { data, error } = await supabase
        .from('service_orders')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating service order:', error);
        return null;
    }
    return fromDbServiceOrder(data);
};

export const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder | null> => {
    const payload = toDbServiceOrder(updates);
    const { data, error } = await supabase
        .from('service_orders')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating service order:', error);
        return null;
    }
    return fromDbServiceOrder(data);
};

// --- Expenses Operations ---

const fromDbExpense = (dbItem: any): Expense => ({
    id: dbItem.id,
    description: dbItem.description,
    amount: Number(dbItem.amount),
    category: dbItem.category,
    date: dbItem.date
});

const toDbExpense = (expense: Partial<Expense>) => {
    const payload: any = {};
    if (expense.description !== undefined) payload.description = expense.description;
    if (expense.amount !== undefined) payload.amount = expense.amount;
    if (expense.category !== undefined) payload.category = expense.category;
    if (expense.date !== undefined) payload.date = expense.date;
    return payload;
};

export const fetchExpenses = async (): Promise<Expense[]> => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
    return data.map(fromDbExpense);
};

export const createExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense | null> => {
    const payload = toDbExpense(expense);
    const { data, error } = await supabase
        .from('expenses')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating expense:', error);
        return null;
    }
    return fromDbExpense(data);
};

export const deleteExpense = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting expense:', error);
        return false;
    }
    return true;
};

// --- Marketing Operations ---

export const createCampaign = async (name: string, template: string, filters: any, customers: Customer[]): Promise<string | null> => {
    // 1. Create Campaign Header
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([{
            name,
            message_template: template,
            filters,
            status: 'ACTIVE'
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creating campaign:", error);
        return null;
    }

    // 2. Create Targets
    const targets = customers.map(c => ({
        campaign_id: campaign.id,
        customer_id: c.id,
        status: 'PENDING'
    }));

    const { error: targetsError } = await supabase
        .from('campaign_targets')
        .insert(targets);

    if (targetsError) {
        console.error("Error adding targets:", targetsError);
    }

    return campaign.id;
};

export const fetchCampaigns = async (): Promise<Campaign[]> => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        messageTemplate: c.message_template,
        filters: c.filters,
        status: c.status,
        createdAt: c.created_at
    }));
};

export const fetchCampaignTargets = async (campaignId: string): Promise<CampaignTarget[]> => {
    const { data, error } = await supabase
        .from('campaign_targets')
        .select(`
            *,
            customers (name, phone)
        `)
        .eq('campaign_id', campaignId);

    if (error) {
        console.error(error);
        return [];
    }

    return data.map((t: any) => ({
        id: t.id,
        campaignId: t.campaign_id,
        customerId: t.customer_id,
        status: t.status,
        sentAt: t.sent_at,
        customerName: t.customers?.name,
        customerPhone: t.customers?.phone
    }));
};

export const markTargetAsSent = async (targetId: string) => {
    await supabase.from('campaign_targets').update({ status: 'SENT', sent_at: new Date() }).eq('id', targetId);
};
