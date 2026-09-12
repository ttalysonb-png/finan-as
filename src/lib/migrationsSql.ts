export const SUPABASE_MIGRATIONS_SQL = `-- ==============================================================================
-- MIGRATION SUPABASE: GESTÃO DE CONTAS FIXAS, RECORRENTES E PARCELAS
-- Data: 2026-09-05
-- Projeto: Sistema de Finanças Pessoais
-- ==============================================================================

-- 1. Garante que as tabelas base existentes possuam todos os campos necessários
CREATE TABLE IF NOT EXISTS public.cards (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    titular TEXT NOT NULL DEFAULT 'Talyson',
    limite NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fatura_atual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    dia_fechamento INTEGER NOT NULL DEFAULT 16,
    dia_vencimento INTEGER NOT NULL DEFAULT 25,
    cor TEXT DEFAULT 'from-indigo-600 to-purple-800',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id BIGSERIAL PRIMARY KEY,
    categoria TEXT NOT NULL,
    periodo TEXT,
    valor_planejado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    origem TEXT NOT NULL,
    classificacao TEXT,
    conta TEXT NOT NULL DEFAULT 'Conta Talyson',
    cartao_id BIGINT REFERENCES public.cards(id) ON DELETE SET NULL,
    entrada NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saida NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    comentario TEXT,
    individuo TEXT NOT NULL DEFAULT 'Ambos',
    operacao TEXT NOT NULL DEFAULT 'Pix',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona coluna de vínculo na tabela de transactions se ainda não existir
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS fixed_installment_id BIGINT;

-- 2. Tabela de Contas Fixas Cadastradas
CREATE TABLE IF NOT EXISTS public.fixed_accounts (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    natureza TEXT NOT NULL DEFAULT 'despesa', -- 'despesa' (despesa fixa) ou 'receita' (previsão de receita)
    origem TEXT NOT NULL DEFAULT 'Infraestrutura',
    classificacao TEXT DEFAULT 'Geral',
    conta TEXT NOT NULL DEFAULT 'Conta Talyson',
    valor_padrao NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    dia_vencimento INTEGER NOT NULL DEFAULT 10,
    tipo_valor TEXT NOT NULL DEFAULT 'fixo', -- 'fixo' (mesmo valor todos os meses) ou 'variavel' (valores editáveis por mês)
    meses_duracao INTEGER NOT NULL DEFAULT 12,
    mes_inicio TEXT NOT NULL, -- Formato 'YYYY-MM'
    is_cartao BOOLEAN NOT NULL DEFAULT FALSE,
    cartao_id BIGINT REFERENCES public.cards(id) ON DELETE SET NULL,
    individuo TEXT NOT NULL DEFAULT 'Ambos',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    observacao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante que a coluna natureza exista mesmo se a tabela já foi criada anteriormente
ALTER TABLE public.fixed_accounts 
ADD COLUMN IF NOT EXISTS natureza TEXT NOT NULL DEFAULT 'despesa';

-- 3. Tabela de Lançamentos Mensais das Contas Fixas (Parcelas / Meses)
CREATE TABLE IF NOT EXISTS public.fixed_account_installments (
    id BIGSERIAL PRIMARY KEY,
    fixed_account_id BIGINT NOT NULL REFERENCES public.fixed_accounts(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL, -- Formato 'YYYY-MM' (Ex: '2026-09')
    numero_parcela INTEGER NOT NULL, -- 1, 2, 3...
    total_parcelas INTEGER NOT NULL, -- 12, 24...
    valor NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    transaction_id BIGINT REFERENCES public.transactions(id) ON DELETE SET NULL,
    conta_pagamento TEXT,
    observacao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Criação de Índices para Alto Desempenho
CREATE INDEX IF NOT EXISTS idx_fixed_acc_ativo ON public.fixed_accounts(ativo);
CREATE INDEX IF NOT EXISTS idx_fixed_inst_periodo ON public.fixed_account_installments(periodo);
CREATE INDEX IF NOT EXISTS idx_fixed_inst_status ON public.fixed_account_installments(status);
CREATE INDEX IF NOT EXISTS idx_fixed_inst_account ON public.fixed_account_installments(fixed_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fixed_inst ON public.transactions(fixed_installment_id);

-- 5. Configuração de RLS (Row Level Security) e Permissões
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_account_installments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow all for cards" ON public.cards;
    CREATE POLICY "Allow all for cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for budgets" ON public.budgets;
    CREATE POLICY "Allow all for budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for transactions" ON public.transactions;
    CREATE POLICY "Allow all for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for fixed_accounts" ON public.fixed_accounts;
    CREATE POLICY "Allow all for fixed_accounts" ON public.fixed_accounts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for fixed_account_installments" ON public.fixed_account_installments;
    CREATE POLICY "Allow all for fixed_account_installments" ON public.fixed_account_installments FOR ALL USING (true) WITH CHECK (true);
END $$;
`;
