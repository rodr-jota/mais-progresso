-- ==============================================================================
-- PROJETO: +Progresso / +Evolução
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (PostgreSQL DDL)
-- Arquivo: sql/script.sql
-- ==============================================================================
-- Este script foi gerado após a análise completa de:
-- 1. server.js (todas as rotas ativas da nova arquitetura de missões/medalhas)
-- 2. data-one.sql (estrutura base inicial e tipos de dados)
-- 3. Diagrama do modelo lógico (incluindo suporte a mensagens/conversas)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. LIMPEZA PREVENTIVA (Caso necessite recriar do zero)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS mensagens CASCADE;
DROP TABLE IF EXISTS conversas CASCADE;
DROP TABLE IF EXISTS medalha_resgatada CASCADE;
DROP TABLE IF EXISTS medalha_aluno CASCADE;
DROP TABLE IF EXISTS medalha CASCADE;
DROP TABLE IF EXISTS missao CASCADE;
DROP TABLE IF EXISTS medalhas_extras_utilizadas CASCADE;
DROP TABLE IF EXISTS progresso_missoes CASCADE;
DROP TABLE IF EXISTS resultados_mensais CASCADE;
DROP TABLE IF EXISTS resultados_missao CASCADE;
DROP TABLE IF EXISTS missoes CASCADE;
DROP TABLE IF EXISTS alunos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ------------------------------------------------------------------------------
-- 1. TABELA: usuarios
-- Armazena todos os usuários do sistema (alunos, coordenadores, admins)
-- ------------------------------------------------------------------------------
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL, -- 'aluno', 'coordenador', etc.
    time VARCHAR(50),            -- 'ALP', 'Food', 'Friboi', 'Flora', 'In Natura'
    criado_em TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABELA: alunos
-- Informações estendidas vinculadas ao usuário aluno
-- ------------------------------------------------------------------------------
CREATE TABLE alunos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    coordenador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    time VARCHAR(50),
    medalha_atual VARCHAR(20) DEFAULT 'Nenhuma',
    qtd_medalhas INTEGER DEFAULT 0,
    rank_atual VARCHAR(20) DEFAULT 'Bronze',
    criado_em TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_alunos_usuario UNIQUE (usuario_id)
);

-- ------------------------------------------------------------------------------
-- 3. TABELAS DA NOVA ARQUITETURA DE METAS E MEDALHAS (Utilizadas pelo server.js)
-- ------------------------------------------------------------------------------

-- Tabela de missões por ano e mês
CREATE TABLE missao (
    id SERIAL PRIMARY KEY,
    ano INTEGER NOT NULL,            -- ex: 2026
    mes VARCHAR(20) NOT NULL,        -- 'Abril', 'Maio', 'Junho', etc.
    titulo VARCHAR(100) NOT NULL,    -- 'Liderança', 'Tino Comercial', 'Extra', etc.
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_missao_ano_mes_titulo UNIQUE (ano, mes, titulo)
);

-- Catálogo de medalhas pertencentes a uma missão
CREATE TABLE medalha (
    id SERIAL PRIMARY KEY,
    id_missao INTEGER NOT NULL REFERENCES missao(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao_meta TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Registro de progresso de cada aluno por medalha
-- Nota: O CONSTRAINT UNIQUE(medalha_id, aluno_id) é MANDATÓRIO para o ON CONFLICT do server.js
CREATE TABLE medalha_aluno (
    id SERIAL PRIMARY KEY,
    medalha_id INTEGER NOT NULL REFERENCES medalha(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    checked BOOLEAN DEFAULT FALSE,
    atualizado_em TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_medalha_aluno UNIQUE (medalha_id, aluno_id)
);

-- Histórico de resgate de medalhas extras para pontuação geral
CREATE TABLE medalha_resgatada (
    id SERIAL PRIMARY KEY,
    medalha_id INTEGER NOT NULL REFERENCES medalha(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    data_resgate TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_medalha_resgatada UNIQUE (medalha_id, aluno_id)
);

-- ------------------------------------------------------------------------------
-- 4. TABELAS DE CHAT E MENSAGENS (Presentes no modelo lógico)
-- ------------------------------------------------------------------------------
CREATE TABLE conversas (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    coordenador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criada_em TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_conversa_aluno_coordenador UNIQUE (aluno_id, coordenador_id)
);

CREATE TABLE mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    remetente_tipo VARCHAR(20) NOT NULL, -- 'aluno' ou 'coordenador'
    remetente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo_texto TEXT,
    anexo_url TEXT,
    anexo_nome VARCHAR(255),
    enviada_em TIMESTAMP DEFAULT NOW(),
    visualizada_em TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. TABELAS LEGADAS / HISTÓRICAS (Compatibilidade com data-one.sql e versão anterior)
-- ------------------------------------------------------------------------------
CREATE TABLE resultados_mensais (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
    mes VARCHAR(20) NOT NULL,
    checkin VARCHAR(20),
    tma NUMERIC,
    interacao_matinal NUMERIC,
    checkin_8 VARCHAR(20),
    analise_dados BOOLEAN DEFAULT FALSE,
    olhar_estrategico BOOLEAN DEFAULT FALSE,
    analise_carteira BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_resultados_mensais_aluno_mes UNIQUE (aluno_id, mes)
);

CREATE TABLE progresso_missoes (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
    mes VARCHAR(20) NOT NULL,
    lideranca1 BOOLEAN DEFAULT FALSE,
    lideranca2 BOOLEAN DEFAULT FALSE,
    tino1 BOOLEAN DEFAULT FALSE,
    tino2 BOOLEAN DEFAULT FALSE,
    extra1 BOOLEAN DEFAULT FALSE,
    medalhas_ganhas INTEGER DEFAULT 0,
    medalhas_extras_ganhas INTEGER DEFAULT 0,
    CONSTRAINT uq_progresso_missoes_aluno_mes UNIQUE (aluno_id, mes)
);

CREATE TABLE medalhas_extras_utilizadas (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL,
    data_utilizacao TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. ÍNDICES DE PERFORMANCE PARA AS CONSULTAS DO BACK-END
-- ------------------------------------------------------------------------------
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_alunos_coordenador ON alunos(coordenador_id);
CREATE INDEX idx_alunos_time ON alunos(time);
CREATE INDEX idx_missao_ano_mes ON missao(ano, mes);
CREATE INDEX idx_medalha_missao ON medalha(id_missao);
CREATE INDEX idx_medalha_aluno_aluno ON medalha_aluno(aluno_id);
CREATE INDEX idx_medalha_resgatada_aluno ON medalha_resgatada(aluno_id);
CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id);
