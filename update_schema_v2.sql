-- Adicionar coluna para Login Ofensor na auditoria
ALTER TABLE assertividade_incidentes 
ADD COLUMN IF NOT EXISTS audit_login_ofensor TEXT;
