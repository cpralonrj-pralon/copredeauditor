-- Create table for Assertiveness Incidents
CREATE TABLE IF NOT EXISTS assertividade_incidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Import Fields (using Text to ensure maximum compatibility with Excel import)
    indicador_nome_icg TEXT,
    id_mostra TEXT,
    volume NUMERIC,
    indicador TEXT,
    indicador_status TEXT,
    in_regional TEXT,
    in_grupo TEXT,
    in_cidade_uf TEXT,
    in_uf TEXT,
    tecnologia TEXT,
    servico TEXT,
    natureza TEXT,
    sintoma TEXT,
    ferramenta_abertura TEXT,
    fechamento TEXT,
    solucao TEXT,
    impacto TEXT,
    enviado_toa TEXT,
    
    -- Date fields (stored as TEXT to avoid parsing issues during bulk text import, can be cast to timestamp in views if needed)
    dt_inicio TEXT, 
    dt_inicio_sistema TEXT,
    dt_inicio_chegou_cop_fo TEXT,
    dt_em_progresso TEXT,
    dt_designado TEXT,
    dt_primeiro_acionamento_rf TEXT,
    dt_primeiro_acionamento_fo TEXT,
    dt_primeiro_acionamento_gpon TEXT,
    dt_fim TEXT,
    dt_fim_sistema TEXT,
    dt_fim_sistema_primeiro_fechamento TEXT,
    
    tma TEXT,
    tmr TEXT,
    anomes TEXT,

    -- Audit/Treatment Fields
    status_audit TEXT DEFAULT 'Pendente', -- 'Pendente' or 'Tratado'
    audit_corrigido BOOLEAN,
    audit_login TEXT,
    audit_motivo TEXT,
    
    -- Constraint to prevent duplicates
    CONSTRAINT assertividade_incidentes_id_mostra_key UNIQUE (id_mostra)
);

-- Optional: Create an index on id_mostra for faster lookups (Index is already creating by UNIQUE constraint, but good to be explicit if using id_mostra for lookups)
-- CREATE INDEX IF NOT EXISTS idx_assertividade_id_mostra ON assertividade_incidentes(id_mostra);

-- Enable Row Level Security (RLS)
ALTER TABLE assertividade_incidentes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (or restrict to authenticated)
CREATE POLICY "Enable read access for all users" ON assertividade_incidentes
    FOR SELECT USING (true);

-- Policy: Allow insert access for all users (or restrict)
CREATE POLICY "Enable insert access for all users" ON assertividade_incidentes
    FOR INSERT WITH CHECK (true);

-- Policy: Allow update for all users
CREATE POLICY "Enable update access for all users" ON assertividade_incidentes
    FOR UPDATE USING (true);
