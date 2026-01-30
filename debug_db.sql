-- PASSO 1: DESATIVAR SEGURANÇA (RLS) TEMPORARIAMENTE
-- Se o login funcionar depois disso, sabemos que é uma regra de segurança quebrada (Loop Infinito)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: LISTAR GATILHOS (Para a gente ver o inimigo)
-- O resultado vai aparecer na aba "Results". Me mande um print!
SELECT 
    event_object_table as tabela,
    trigger_name as nome_gatilho,
    event_manipulation as evento,
    action_statement as o_que_faz
FROM information_schema.triggers
WHERE event_object_schema IN ('auth', 'public')
ORDER BY event_object_table;

-- PASSO 3: TENTATIVA DE SALVA-VIDAS (Grant Postgres)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres;
