-- EMERGENCY FIX: Limpeza de Sessões e Permissões de Sistema

-- 1. REMOVER GATILHOS DE SESSÃO (Isso quebra o login muitas vezes)
-- Se tiver algum plugin tentando monitorar sessões, ele vai morrer aqui.
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table IN ('sessions', 'refresh_tokens')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || trg.trigger_name || '" ON auth.' || trg.event_object_table || ' CASCADE';
        RAISE NOTICE 'Gatilho removido: % da tabela %', trg.trigger_name, trg.event_object_table;
    END LOOP;
END $$;

-- 2. GARANTIR QUE O AUTH ADMIN VÊ O SISTEMA (INFORMATION_SCHEMA)
-- O erro "Error querying schema" pode ser falta de acesso ao catálogo do banco
GRANT USAGE ON SCHEMA information_schema TO supabase_auth_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO supabase_auth_admin;

-- 3. REFORÇAR DONO DO ESQUEMA AUTH
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;

-- 4. REFORÇAR PUBLIC
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
