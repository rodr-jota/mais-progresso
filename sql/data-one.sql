-- DROP TABLE IF EXISTS missoes cascade;
-- DROP TABLE IF EXISTS resultados_mensais cascade;
-- DROP TABLE IF EXISTS alunos cascade;
-- DROP TABLE IF EXISTS usuarios cascade;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    time VARCHAR(50)
);

CREATE TABLE alunos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    coordenador_id INTEGER REFERENCES usuarios(id),
    time VARCHAR(50),
    medalha_atual VARCHAR(20),
    qtd_medalhas INTEGER DEFAULT 0
);

CREATE TABLE resultados_mensais (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER REFERENCES alunos(id),
    mes VARCHAR(20),

    checkin NUMERIC,
    tma NUMERIC,
    interacao_matinal NUMERIC,
    checkin_8 NUMERIC,
    analise_dados BOOLEAN,
    olhar_estrategico BOOLEAN,
    analise_carteira BOOLEAN
);
CREATE TABLE missoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    descricao TEXT
);
CREATE TABLE progresso_missoes (
    id SERIAL PRIMARY KEY,

    aluno_id INTEGER REFERENCES alunos(id),

    mes VARCHAR(20),

    lideranca1 BOOLEAN,
    lideranca2 BOOLEAN,

    tino1 BOOLEAN,
    tino2 BOOLEAN,

    extra1 BOOLEAN,

    medalhas_ganhas INTEGER
);



INSERT INTO usuarios(nome, email, senha, perfil, time)
VALUES
('Ricardo Ricci', 'ricardo.ricci@institutojef.org.br', 'RicRic', 'coordenador', 'ALP'),
('Milena Albuquerque', 'milena.albuquerque@institutojef.org.br', 'MilAlb', 'coordenador', 'Food'),
('Danilo Gonçalves', 'danilo.goncalves@institutojef.org.br', 'DanGon', 'coordenador', 'Friboi'),
('Alexsandro Silva', 'alexsandro.silva@institutojef.org.br', 'AleSil', 'coordenador', 'Flora'),
('Adalci Farias', 'adalci.farias@institutojef.org.br', 'AdaFar', 'coordenador', 'Seara'),
('Alicia Ferreira Pereira', 'alicia.pereira@institutojef.org.br', 'Ferreira_ali_jef2026', 'aluno', 'Flora'),
('Bianca Venturelli Dominiquini', 'bianca.dominiquini@institutojef.org.br', 'Venturelli_bia_jef2026', 'aluno', 'Friboi'),
('Emilly Monteiro Dourado', 'emilly.dourado@institutojef.org.br', 'Monteiro_emi_jef2026', 'aluno', 'Flora'),
('Enzo Mendonça Ferreira', 'enzo.ferreira@institutojef.org.br', 'Mendonca_enz_jef2026', 'aluno', 'Friboi'),
('Gustavo Ambrózio Morais', 'gustavo.morais@institutojef.org.br', 'Ambrozio_gus_jef2026', 'aluno', 'Friboi'),
('Helena Faria Alves Cardoso', 'helena.cardoso@institutojef.org.br', 'Faria_hel_jef2026', 'aluno', 'Friboi'),
('Isabela Alana Garcia', 'isabela.garcia@institutojef.org.br', 'Alana_isa_jef2026', 'aluno', 'ALP'),
('Isabela Emanoelle Araujo da Silva', 'isabela.silva@institutojef.org.br', 'Emanoelle_isa_jef2026', 'aluno', 'Friboi'),
('Isabelly Dos Passos Rabelo', 'isabelly.rabelo@institutojef.org.br', 'Dos_isa_jef2026', 'aluno', 'In Natura'),
('Julia Medeiros De Oliveira', 'julia.oliveira@institutojef.org.br', 'Medeiros_jul_jef2026', 'aluno', 'Flora'),
('Julia Yoshida Minucelli', 'julia.minucelli@institutojef.org.br', 'Yoshida_jul_jef2026', 'aluno', 'ALP'),
('Manuela Oliveira Amorim', 'manuela.amorim@institutojef.org.br', 'Oliveira_man_jef2026', 'aluno', 'Food'),
('Murilo Andreatta', 'murilo.andreatta@institutojef.org.br', 'Andreatta_mur_jef2026', 'aluno', 'Food'),
('Pedro Henrique Ackermann', 'pedro.ackermann@institutojef.org.br', 'Henrique_ped_jef2026', 'aluno', 'Friboi'),
('Pietro Pantalone Fiori', 'pietro.fiori@institutojef.org.br', 'Pantalone_pie_jef2026', 'aluno', 'Food'),
('Rafael Kojiro Baroni Watanabe', 'rafael.watanabe@institutojef.org.br', 'Kojiro_raf_jef2026', 'aluno', 'Friboi'),
('Raj Santana', 'raj.santana@institutojef.org.br', 'Santana_raj_jef2026', 'aluno', 'In Natura'),
('Samuel Kassio Dos Santos Silva', 'samuel.kassio@institutojef.org.br', 'Kassio_sam_jef2026', 'aluno', 'Flora'),
('Victor Dias Fernandes', 'victor.fernandes@institutojef.org.br', 'Dias_vic_jef2026', 'aluno', 'Flora'),
('Yohan Bassi Dezen', 'yohan.dezen@institutojef.org.br', 'Bassi_yoh_jef2026', 'aluno', 'Friboi'),
('Ana Clara Gama Ignacio', 'ana.ignacio@institutojef.org.br', 'Clara_ana_jef2026', 'aluno', 'In Natura'),
('Ana Julia Goncalves Rios Cohatu', 'ana.cohatu@institutojef.org.br', 'Julia_ana_jef2026', 'aluno', 'ALP'),
('Breno Venas De Carvalho E Silva', 'breno.silva@institutojef.org.br', 'Venas_bre_jef2026', 'aluno', 'Food'),
('Claudia Vitória Menezes Silva', 'claudia.silva@institutojef.org.br', 'Vitoria_cla_jef2026', 'aluno', 'Food'),
('Gabriel Silva Medeiros', 'gabriel.medeiros@institutojef.org.br', 'Silva_gab_jef2026', 'aluno', 'Friboi'),
('Heloisa Nogueira Alecrim', 'heloisa.alecrim@institutojef.org.br', 'Nogueira_hel_jef2026', 'aluno', 'Food'),
('Igor Siqueira Noberto', 'igor.noberto@institutojef.org.br', 'Siqueira_igo_jef2026', 'aluno', 'ALP'),
('Lígia Borba Dos Anjos', 'ligia.anjos@institutojef.org.br', 'Borba_lig_jef2026', 'aluno', 'In Natura'),
('Lívia Viana Bauer Ventura', 'livia.ventura@institutojef.org.br', 'Viana_liv_jef2026', 'aluno', 'ALP'),
('Lucio Nogueira Hermann', 'lucio.hermann@institutojef.org.br', 'Nogueira_luc_jef2026', 'aluno', 'Flora'),
('Luiz Felipe Ferreira De Andrade', 'luiz.andrade@institutojef.org.br', 'Felipe_lui_jef2026', 'aluno', 'Food'),
('Luiz Porto Lima', 'luiz.lima@institutojef.org.br', 'Porto_lui_jef2026', 'aluno', 'ALP'),
('Maria Cecília Mantovanini Romero Miguel', 'maria.miguel@institutojef.org.br', 'Cecilia_mar_jef2026', 'aluno', 'Food'),
('Matheus Lianza Da Silva', 'matheus.silva@institutojef.org.br', 'Lianza_mat_jef2026', 'aluno', 'ALP'),
('Milena Alencar de Moura Zanotti', 'milena.zanotti@institutojef.org.br', 'Alencar_mil_jef2026', 'aluno', 'Food'),
('Murilo Araujo França', 'murilo.franca@institutojef.org.br', 'Araujo_mur_jef2026', 'aluno', 'In Natura'),
('Nataly Santos Barbosa De Sá', 'nataly.sa@institutojef.org.br', 'Santos_nat_jef2026', 'aluno', 'Food'),
('Pedro Ribeiro Costa', 'pedro.rcosta@institutojef.org.br', 'Ribeiro_ped_jef2026', 'aluno', 'Friboi'),
('Rhaianny Miranda Dos Santos', 'rhaianny.santos@institutojef.org.br', 'Miranda_rha_jef2026', 'aluno', 'In Natura'),
('Sofia Florian Senedeze', 'sofia.senedeze@institutojef.org.br', 'Florian_sof_jef2026', 'aluno', 'Friboi'),
('Victor Hugo Pereira Canova', 'victor.canova@institutojef.org.br', 'Hugo_vic_jef2026', 'aluno', 'In Natura'),
('Victoria Adorno Arem', 'victoria.arem@institutojef.org.br', 'Adorno_vic_jef2026', 'aluno', 'In Natura');

-- INSERT INTO alunos
-- (
--     usuario_id,
--     coordenador_id,
--     time,
--     medalha_atual,
--     qtd_medalhas
-- )

ALTER TABLE resultados_mensais
ALTER COLUMN checkin TYPE VARCHAR(20);

ALTER TABLE resultados_mensais
ALTER COLUMN checkin_8 TYPE VARCHAR(20);

ALTER TABLE resultados_mensais
ALTER COLUMN tma TYPE NUMERIC using tma::numeric;

INSERT INTO alunos
(
    usuario_id,
    coordenador_id,
    time,
    medalha_atual,
    qtd_medalhas
)

SELECT
    u.id,

    CASE
        WHEN u.time = 'ALP' THEN 1
        WHEN u.time = 'Food' THEN 2
        WHEN u.time = 'Friboi' THEN 3
        WHEN u.time = 'Flora' THEN 4
        WHEN u.time = 'In Natura' THEN 5
    END,

    u.time,

    'Nenhuma',

    0

FROM usuarios u

WHERE u.perfil = 'aluno';
Select * from alunos;
select email, nome, senha from usuarios offset 5;
select * from resultados_mensais;


SELECT *
FROM resultados_mensais
LIMIT 1;

ALTER TABLE alunos
ADD COLUMN rank_atual VARCHAR(20)
DEFAULT 'Bronze';

ALTER TABLE progresso_missoes
ADD COLUMN medalhas_extras_ganhas INTEGER
DEFAULT 0;

CREATE TABLE medalhas_extras_utilizadas (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER REFERENCES alunos(id),
    quantidade INTEGER NOT NULL,
    data_utilizacao TIMESTAMP DEFAULT NOW()
);

select u.nome, a.time, a.rank_atual from alunos a join usuarios u on a.usuario_id = u.id where a.time = 'In Natura';
select * from progresso_missoes;
select * from resultados_mensais;
select * from alunos;
select * from usuarios;

SELECT aluno_id, mes, COUNT(*)
FROM resultados_mensais
GROUP BY aluno_id, mes
HAVING COUNT(*) > 1;

--ZERAR DADOS
TRUNCATE TABLE resultados_mensais RESTART IDENTITY;
TRUNCATE TABLE progresso_missoes RESTART IDENTITY;
TRUNCATE TABLE medalhas_extras_utilizadas RESTART IDENTITY;
UPDATE alunos
SET qtd_medalhas = 0;
UPDATE alunos
SET rank_atual = 'Bronze';

-- Impede mais de um lançamento por (aluno, mês) em cada tabela
ALTER TABLE resultados_mensais
  ADD CONSTRAINT uq_resultados_mensais_aluno_mes UNIQUE (aluno_id, mes);

ALTER TABLE progresso_missoes
  ADD CONSTRAINT uq_progresso_missoes_aluno_mes UNIQUE (aluno_id, mes);