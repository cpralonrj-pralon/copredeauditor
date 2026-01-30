-- Adicionar coluna para data de atualização da auditoria
ALTER TABLE assertividade_incidentes 
ADD COLUMN IF NOT EXISTS audit_updated_at TIMESTAMP WITH TIME ZONE;
