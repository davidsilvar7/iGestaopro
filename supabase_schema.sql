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
  trade_in_items jsonb,
  trade_in_amount numeric default 0,
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

-- 4. Tabela de Clientes/Leads (CRM)
create table customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text not null,
  email text,
  cpf text,
  address text,
  lifecycle_stage text not null default 'LEAD', -- 'LEAD' or 'CLIENT'
  status text not null default 'NEW', -- 'NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST'
  source text,
  device_owned text,
  interest text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabela de Interações (CRM)
create table interactions (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references customers(id) on delete cascade not null,
  type text not null, -- 'WHATSAPP', 'CALL', 'VISIT', 'EMAIL', 'OTHER'
  notes text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by text, -- User ID (optional for MVP)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table customers enable row level security;
alter table interactions enable row level security;

create policy "Enable access to all users" on customers for all using (true);
create policy "Enable access to all users" on interactions for all using (true);

-- 6. Tabela de Despesas (Expenses)
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  amount numeric not null,
  category text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table expenses enable row level security;
create policy "Enable access to all users" on expenses for all using (true);

-- 7. Marketing Campaigns
create table campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  message_template text not null,
  filters jsonb, -- Stores filter criteria used (e.g., { device: 'iPhone' })
  status text default 'DRAFT', -- DRAFT, ACTIVE, COMPLETED
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table campaign_targets (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  status text default 'PENDING', -- PENDING, SENT, FAILED
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table campaigns enable row level security;
alter table campaign_targets enable row level security;

create policy "Enable access to all users" on campaigns for all using (true);
create policy "Enable access to all users" on campaign_targets for all using (true);

-- 8. Trade-In Simulations
create table trade_in_simulations (
  id uuid default uuid_generate_v4() primary key,
  new_device_model text,
  new_device_price numeric,
  used_device_model text,
  used_device_details jsonb, -- Stores capacity, grade, defects, etc.
  market_value numeric,
  offer_value numeric,
  difference numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table trade_in_simulations enable row level security;
create policy "Enable access to all users" on trade_in_simulations for all using (true);
