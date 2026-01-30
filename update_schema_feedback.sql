-- Add column to track if feedback was sent to the offender
ALTER TABLE assertividade_incidentes ADD COLUMN IF NOT EXISTS audit_feedback_enviado BOOLEAN DEFAULT FALSE;
