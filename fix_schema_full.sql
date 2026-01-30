-- Garante que todas as colunas de auditoria existam
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_motivo TEXT;
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_corrigido BOOLEAN;
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_evidencia_url TEXT;
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_login TEXT;

-- Novas colunas (que podem estar faltando)
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_login_ofensor TEXT;
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_updated_at TIMESTAMP WITH TIME ZONE;
