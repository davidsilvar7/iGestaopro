-- Execute este script no SQL Editor do Supabase para corrigir a tabela de transações

-- Adiciona as colunas necessárias se elas não existirem
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS trade_in_items jsonb,
ADD COLUMN IF NOT EXISTS trade_in_amount numeric default 0,
ADD COLUMN IF NOT EXISTS items jsonb;

-- Garante que as novas colunas possam ser acessadas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Reforça a política de inserção (Insert)
DROP POLICY IF EXISTS "Enable insert for all users" ON transactions;
CREATE POLICY "Enable insert for all users" ON transactions FOR INSERT WITH CHECK (true);

-- Garante SELECT/UPDATE/DELETE também
DROP POLICY IF EXISTS "Enable access to all users" ON transactions;
CREATE POLICY "Enable access to all users" ON transactions FOR ALL USING (true);
