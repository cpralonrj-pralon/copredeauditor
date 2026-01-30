-- 1. Adicionar coluna para URL da evidência
ALTER TABLE assertividade_incidentes 
ADD COLUMN IF NOT EXISTS audit_evidencia_url TEXT;

-- 2. Criar bucket 'evidence' (se não existir)
-- Nota: A criação de buckets via SQL pode variar dependendo da versão/extensões.
-- O ideal é criar pelo menu "Storage" do Supabase se este comando falhar.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Segurança (RLS) para o Storage
-- Permitir leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'evidence' );

-- Permitir upload para qualquer um (anon) - Ajuste conforme necessidade
CREATE POLICY "Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'evidence' );
