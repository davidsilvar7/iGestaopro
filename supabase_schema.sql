-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabela de Estoque (Inventory)
create table inventory (
  id uuid default uuid_generate_v4() primary key,
  category text not null,
  name text not null,
  sku text,
  cost_price numeric default 0,
  sell_price numeric default 0,
  quantity integer default 0,
  min_stock_level integer default 0,
  storage text,
  color text,
  condition text,
  imei text,
  observation text,
  service_type text,
  service_subtype text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Transações (Transactions)
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('SALE', 'SERVICE', 'EXPENSE')),
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  total_amount numeric default 0,
  total_cost numeric default 0,
  total_profit numeric default 0,
  items jsonb, -- Armazena os itens da transação como JSON
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Ordens de Serviço (Service Orders)
create table service_orders (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  device_model text not null,
  problem_description text,
  status text default 'Aguardando',
  entry_date timestamp with time zone default timezone('utc'::text, now()) not null,
  total numeric default 0,
  checklist jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Segurança (RLS - Row Level Security)
-- Permitir acesso público para simplificar o MVP (Idealmente adicionar autenticação depois)
alter table inventory enable row level security;
alter table transactions enable row level security;
alter table service_orders enable row level security;

create policy "Enable access to all users" on inventory for all using (true);
create policy "Enable access to all users" on transactions for all using (true);
create policy "Enable access to all users" on service_orders for all using (true);
