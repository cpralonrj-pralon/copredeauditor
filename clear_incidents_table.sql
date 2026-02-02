-- Script para limpar a tabela de incidentes/auditoria
-- ⚠️ ATENÇÃO: Este script vai DELETAR TODOS os dados da tabela!

-- ========================================
-- OPÇÃO 1: Deletar TODOS os incidentes
-- ========================================
-- Descomente a linha abaixo para executar:

-- TRUNCATE TABLE assertividade_incidentes RESTART IDENTITY CASCADE;

-- ========================================
-- OPÇÃO 2: Deletar incidentes específicos por status
-- ========================================
-- Deletar apenas incidentes "Tratado":
-- DELETE FROM assertividade_incidentes WHERE status_audit = 'Tratado';

-- Deletar apenas incidentes "Pendente":
-- DELETE FROM assertividade_incidentes WHERE status_audit = 'Pendente';

-- ========================================
-- OPÇÃO 3: Deletar incidentes por data
-- ========================================
-- Deletar incidentes antes de uma data específica:
-- DELETE FROM assertividade_incidentes WHERE created_at < '2026-01-01';

-- Deletar incidentes mais antigos que 30 dias:
-- DELETE FROM assertividade_incidentes WHERE created_at < NOW() - INTERVAL '30 days';

-- ========================================
-- OPÇÃO 4: Backup antes de deletar
-- ========================================
-- Criar uma cópia de backup antes de limpar:

-- 1. Criar tabela de backup
-- CREATE TABLE assertividade_incidentes_backup AS SELECT * FROM assertividade_incidentes;

-- 2. Limpar a tabela original
-- TRUNCATE TABLE assertividade_incidentes RESTART IDENTITY CASCADE;

-- 3. Para restaurar do backup (se necessário):
-- INSERT INTO assertividade_incidentes SELECT * FROM assertividade_incidentes_backup;

-- ========================================
-- VERIFICAÇÃO: Contar registros
-- ========================================
-- Ver quantos registros existem antes de deletar:
SELECT 
    COUNT(*) as total_incidentes,
    COUNT(CASE WHEN status_audit = 'Tratado' THEN 1 END) as tratados,
    COUNT(CASE WHEN status_audit = 'Pendente' THEN 1 END) as pendentes
FROM assertividade_incidentes;

-- ========================================
-- RECOMENDAÇÃO
-- ========================================
-- 1. Execute primeiro a query SELECT acima para ver quantos registros existem
-- 2. Escolha a opção que mais faz sentido para você
-- 3. Descomente a linha correspondente
-- 4. Execute o script
