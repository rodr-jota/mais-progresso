-- ==============================================================================
-- CARGA DE DADOS: MISSÕES E MEDALHAS (Abril a Outubro de 2026)
-- Arquivo: sql/popular_missoes_medalhas.sql
-- ==============================================================================
-- Baseado no Excel e nas diretrizes fornecidas:
-- - Meses padronizados por extenso ('Abril', 'Maio', 'Junho', 'Agosto', 'Setembro', 'Outubro')
--   compatíveis com o array MESES_ORDEM do back-end (server.js).
-- - Inserção das missões por categoria (Liderança, Categoria Temática do Mês e Extra).
-- - Inserção de todas as medalhas e metas correspondentes com os IDs originais.
-- - Ajuste automático das sequências SERIAL para futuras inserções.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. POPULAR TABELA 'missao'
-- ------------------------------------------------------------------------------
INSERT INTO missao (id, ano, mes, titulo, descricao) VALUES
(1,  2026, 'Abril',    'Liderança',         'Missão de Liderança de Abril'),
(2,  2026, 'Abril',    'Tino Comercial',    'Missão de Tino Comercial de Abril'),
(3,  2026, 'Maio',     'Liderança',         'Missão de Liderança de Maio'),
(4,  2026, 'Maio',     'Tomada de decisão', 'Missão de Tomada de Decisão de Maio'),
(5,  2026, 'Junho',    'Liderança',         'Missão de Liderança de Junho'),
(6,  2026, 'Junho',    'Vontade',           'Missão de Vontade de Junho'),
(7,  2026, 'Agosto',   'Liderança',         'Missão de Liderança de Agosto'),
(8,  2026, 'Agosto',   'Tomada de decisão', 'Missão de Tomada de Decisão de Agosto'),
(9,  2026, 'Agosto',   'Extra',             'Missão Extra de Agosto'),
(10, 2026, 'Setembro', 'Liderança',         'Missão de Liderança de Setembro'),
(11, 2026, 'Setembro', 'Tino Comercial',    'Missão de Tino Comercial de Setembro'),
(12, 2026, 'Outubro',  'Liderança',         'Missão de Liderança de Outubro'),
(13, 2026, 'Outubro',  'Tino Comercial',    'Missão de Tino Comercial de Outubro'),
(14, 2026, 'Maio',     'Extra',             'Missão Extra cadastrada no feedback de Maio')
ON CONFLICT (id) DO UPDATE SET
    ano = EXCLUDED.ano,
    mes = EXCLUDED.mes,
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao;

-- Atualizar sequence de missao
SELECT setval(pg_get_serial_sequence('missao', 'id'), (SELECT COALESCE(MAX(id), 1) FROM missao));

-- ------------------------------------------------------------------------------
-- 2. POPULAR TABELA 'medalha'
-- ------------------------------------------------------------------------------
INSERT INTO medalha (id, id_missao, nome, descricao_meta) VALUES
-- Abril (Missão 1: Liderança, Missão 2: Tino Comercial)
(1,  1,  'Check-in 8h + Check-in %', 'Fazer o 1º check-in até 8h e manter ≥ 90% no mês'),
(2,  1,  'TMA + Interação matinal',  'Participar das matinais e atingir TMA total de 3h30'),
(3,  2,  'Ações estratégicas',       'Apresentar ações estratégicas nas negociações práticas'),
(4,  2,  'Análise de carteira',      'Analisar semanalmente a carteira e seus resultados'),

-- Maio (Missão 3: Liderança, Missão 4: Tomada de decisão, Missão 14: Extra)
(5,  3,  'Check-in 8h + Check-in %', 'Fazer o 1º check-in até 8h e manter ≥ 90% no mês'),
(6,  3,  'TMA + Interação matinal',  'Participar das matinais e atingir TMA total de 3h30'),
(7,  4,  'Apresentar 2 clientes',    'Escolher 2 clientes e justificar a seleção com análise'),
(8,  4,  'Ações check de metas',     'Apresentar as ações definidas no check de metas'),
(26, 14, 'Medalha Extra',            'Medalha Extra'),

-- Junho (Missão 5: Liderança, Missão 6: Vontade)
(9,  5,  'Check-in 8h + Check-in %', 'Fazer o 1º check-in até 8h e manter ≥ 90% no mês'),
(10, 5,  'TMA + Interação matinal',  'Participar das matinais e atingir TMA total de 3h30'),
(11, 6,  'Incluir itens novos',      'Incluir 1 item novo em 5 clientes e comprovar entrega'),
(12, 6,  'APAS',                     'A DEFINIR'),

-- Agosto (Missão 7: Liderança, Missão 8: Tomada de decisão, Missão 9: Extra)
(13, 7,  'Chegar às 8h',             'Chegar à escola até 8h'),
(14, 7,  'Protagonismo na matinal',  'Compartilhar ideias, fazer perguntas e apoiar o time'),
(15, 8,  'Análise de carteira',      'Analisar a nova carteira e identificar aprendizados'),
(16, 8,  'Ações 2 semestre',         'Definir ações do 2º semestre com base nas competências'),
(17, 9,  'Desafio SKU por empresa',  'Incluir o SKU definido pelo negócio em 5 clientes'),

-- Setembro (Missão 10: Liderança, Missão 11: Tino Comercial)
(18, 10, 'Chegar às 8h',             'Chegar à escola até 8h'),
(19, 10, 'Protagonismo na matinal',  'Compartilhar ideias, fazer perguntas e apoiar o time'),
(20, 11, 'Ação sell-out',            'Realizar uma ação de sell-out'),
(21, 11, 'Boa prática',              'Apresentar boa prática com criatividade e organização'),

-- Outubro (Missão 12: Liderança - 3 medalhas, Missão 13: Tino Comercial - 1 medalha)
(22, 12, 'Chegar às 8h',             'Chegar à escola até 8h'),
(23, 12, 'Protagonismo na matinal',  'Compartilhar ideias, fazer perguntas e apoiar o time'),
(24, 12, 'Apresentação liderança',   'Apresentação para inspirar o time e refletir sobre as competências'),
(25, 13, 'IPC do time',              'Aumentar o IPC da equipe de acordo com objetivo definido por time')
ON CONFLICT (id) DO UPDATE SET
    id_missao = EXCLUDED.id_missao,
    nome = EXCLUDED.nome,
    descricao_meta = EXCLUDED.descricao_meta;

-- Atualizar sequence de medalha
SELECT setval(pg_get_serial_sequence('medalha', 'id'), (SELECT COALESCE(MAX(id), 1) FROM medalha));

-- ------------------------------------------------------------------------------
-- 3. EXTRA DE MAIO: VINCULAR MEDALHA EXTRA A TODOS OS ALUNOS (Feedback de Maio)
-- Conforme descrito: "Todos os alunos a receberam."
-- ------------------------------------------------------------------------------
INSERT INTO medalha_aluno (medalha_id, aluno_id, checked, atualizado_em)
SELECT 
    26 AS medalha_id, -- ID da Medalha Extra de Maio
    a.id AS aluno_id,
    TRUE AS checked,
    NOW() AS atualizado_em
FROM alunos a
ON CONFLICT (medalha_id, aluno_id) DO UPDATE SET 
    checked = TRUE, 
    atualizado_em = NOW();

-- ------------------------------------------------------------------------------
-- 4. CONSULTA DE CONFERÊNCIA
-- ------------------------------------------------------------------------------
SELECT 
    m.id AS missao_id,
    m.ano,
    m.mes,
    m.titulo AS categoria_missao,
    med.id AS medalha_id,
    med.nome AS nome_medalha,
    med.descricao_meta
FROM missao m
JOIN medalha med ON med.id_missao = m.id
ORDER BY m.id, med.id;
