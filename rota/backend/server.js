const express = require("express");
const path = require("path");
const cors = require("cors");
const pool = require("./db");

const app = express();
const projectRoot = path.resolve(__dirname, "..", "..");

//Middleware

app.use(cors());
app.use(express.json());
app.use(express.static(projectRoot));

// Teste de conexão com banco

pool
  .query("SELECT NOW()")
  .then((res) => {
    console.log("Conectado ao PostgreSQL!");
    console.log(res.rows);
  })
  .catch((err) => {
    console.error("Erro ao conectar ao PostgreSQL:");
    console.error(err);
  });

function calcularRank(totalMedalhas) {
  const ranks = [
    "Bronze",
    "Prata",
    "Ouro",
    "Platina",
    "Diamante",
    "Mestre",
    "Lendário",
  ];
  const limiteAteMestre = 15; // 3 medalhas × 5 ranks (Bronze até Diamante)

  let indice;
  if (totalMedalhas < limiteAteMestre) {
    indice = Math.floor(totalMedalhas / 3);
  } else {
    const alemDoMestre = totalMedalhas - limiteAteMestre;
    indice = alemDoMestre >= 5 ? 6 : 5; // precisa de 5 (não 3) pra sair de Mestre
  }

  if (indice > 6) indice = 6;
  return ranks[indice];
}

// =====================
// LÓGICA DE ORDEM DOS MESES
// =====================
const MESES_ORDEM = [
  "Abril",
  "Maio",
  "Junho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
];

const ANO_ATUAL = 2026;

async function contarAlunosDoCoordenador(coordenadorId) {
  const r = await pool.query(
    `SELECT COUNT(*) as total FROM alunos WHERE coordenador_id = $1`,
    [coordenadorId],
  );
  return Number(r.rows[0].total);
}

async function mesCompleto(coordenadorId, mes, totalAlunos) {
  if (totalAlunos === 0) return true;

  const medalhasDoMes = await pool.query(
    `SELECT medalha.id
     FROM medalha
     JOIN missao ON missao.id = medalha.id_missao
     WHERE missao.ano = $1 AND missao.mes = $2`,
    [ANO_ATUAL, mes],
  );
  const medalhaIds = medalhasDoMes.rows.map((m) => m.id);
  if (medalhaIds.length === 0) return false;

  const r = await pool.query(
    `SELECT aluno_id
     FROM medalha_aluno
     WHERE medalha_id = ANY($1::int[])
       AND aluno_id IN (SELECT id FROM alunos WHERE coordenador_id = $2)
     GROUP BY aluno_id
     HAVING COUNT(DISTINCT medalha_id) = $3`,
    [medalhaIds, coordenadorId, medalhaIds.length],
  );

  return r.rows.length === totalAlunos;
}

async function statusMeses(coordenadorId) {
  const totalAlunos = await contarAlunosDoCoordenador(coordenadorId);

  const mesesCompletos = [];
  let mesLancavel = MESES_ORDEM[0];

  for (let i = 0; i < MESES_ORDEM.length; i++) {
    const mes = MESES_ORDEM[i];
    const completo = await mesCompleto(coordenadorId, mes, totalAlunos);

    if (completo) {
      mesesCompletos.push(mes);
      mesLancavel = MESES_ORDEM[i + 1] || null;
    } else {
      mesLancavel = mes;
      break;
    }
  }

  const indexLancavel = mesLancavel
    ? MESES_ORDEM.indexOf(mesLancavel)
    : MESES_ORDEM.length;
  const mesesBloqueados = MESES_ORDEM.filter((_, i) => i > indexLancavel);

  return {
    mes_lancavel: mesLancavel,
    meses_completos: mesesCompletos,
    meses_bloqueados: mesesBloqueados,
  };
}

// statusMeses() continua exatamente igual — só se beneficia do mesCompleto novo.

async function statusMesesAluno(alunoId) {
  const mesesCompletos = [];

  for (const mes of MESES_ORDEM) {
    const medalhasDoMes = await pool.query(
      `SELECT medalha.id
       FROM medalha JOIN missao ON missao.id = medalha.id_missao
       WHERE missao.ano = $1 AND missao.mes = $2`,
      [ANO_ATUAL, mes],
    );
    const medalhaIds = medalhasDoMes.rows.map((m) => m.id);
    if (medalhaIds.length === 0) break; // mês ainda não cadastrado

    const r = await pool.query(
      `SELECT COUNT(DISTINCT medalha_id) AS total
       FROM medalha_aluno
       WHERE aluno_id = $1 AND medalha_id = ANY($2::int[])`,
      [alunoId, medalhaIds],
    );

    if (Number(r.rows[0].total) === medalhaIds.length) {
      mesesCompletos.push(mes);
    } else {
      break;
    }
  }

  const ultimoIndex = mesesCompletos.length - 1;
  const mesesBloqueados = MESES_ORDEM.filter((_, i) => i > ultimoIndex);
  return { meses_completos: mesesCompletos, meses_bloqueados: mesesBloqueados };
}

// =====================
// ROTAS
// =====================

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

// LOGIN (VERSÃO DE TESTE)
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        erro: "Usuário não encontrado",
      });
    }

    const usuario = resultado.rows[0];

    let alunoId = null;

    if (usuario.perfil === "aluno") {
      const aluno = await pool.query(
        `
            SELECT id
            FROM alunos
            WHERE usuario_id = $1
            `,
        [usuario.id],
      );

      if (aluno.rows.length > 0) {
        alunoId = aluno.rows[0].id;
      }
    }

    if (usuario.senha !== senha) {
      return res.status(401).json({
        erro: "Senha incorreta",
      });
    }

    res.json({
      id: usuario.id,
      aluno_id: alunoId,
      nome: usuario.nome,
      perfil: usuario.perfil,
      time: usuario.time,
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
});

// ROTA PARA RANKING E GRÁFICO (NÃO TEM O ID DO COORDENADOR NA URL)
// =====================
app.get("/alunos", async (req, res) => {
  try {
    const timeFiltro = req.query.time || "Geral";
    const mesFiltro = req.query.mes || null; // ex: "Abril"

    let condicaoTime = "";
    let params = [];

    if (timeFiltro !== "Geral" && timeFiltro !== "") {
      condicaoTime = "WHERE a.time = $1";
      params = [timeFiltro];
    }

    if (!mesFiltro) {
      const queryAlunos = `
  SELECT a.id, u.id AS usuario_id, u.nome, a.rank_atual, a.qtd_medalhas, a.time
  FROM alunos a
  JOIN usuarios u ON a.usuario_id = u.id
  ${condicaoTime}
  ORDER BY a.qtd_medalhas DESC, u.nome
`;
      const resultado = await pool.query(queryAlunos, params);

      const ids = resultado.rows.map((a) => a.id);
      const saldos = await saldosMedalhaExtraEmLote(ids);

      const linhasComSaldo = resultado.rows.map((aluno) => ({
        ...aluno,
        saldo_medalha_extra: saldos[aluno.id] || 0,
      }));

      return res.json(linhasComSaldo);
    }

    // Com mês: soma acumulada de medalhas até (e incluindo) o mês filtrado
    const indexMes = MESES_ORDEM.indexOf(mesFiltro);
    if (indexMes === -1) {
      return res.status(400).json({ erro: "Mês inválido" });
    }
    const mesesAteFiltro = MESES_ORDEM.slice(0, indexMes + 1);
    const paramIndexMeses = params.length + 1;

    const queryAlunos = `
  SELECT
    a.id,
    u.id AS usuario_id,
    u.nome,
    a.time,
    COALESCE(SUM(pm.medalhas_ganhas), 0) AS qtd_medalhas
  FROM alunos a
  JOIN usuarios u ON a.usuario_id = u.id
  LEFT JOIN progresso_missoes pm
    ON pm.aluno_id = a.id AND pm.mes = ANY($${paramIndexMeses}::text[])
  ${condicaoTime}
  GROUP BY a.id, u.id, u.nome, a.time
  ORDER BY qtd_medalhas DESC, u.nome
`;
    params.push(mesesAteFiltro);

    const resultado = await pool.query(queryAlunos, params);
    const linhas = resultado.rows.map((aluno) => ({
      ...aluno,
      qtd_medalhas: Number(aluno.qtd_medalhas),
      rank_atual: calcularRank(Number(aluno.qtd_medalhas)),
    }));

    const ids = linhas.map((a) => a.id);
    const saldos = await saldosMedalhaExtraEmLote(ids);

    const linhasComSaldo = linhas.map((aluno) => ({
      ...aluno,
      saldo_medalha_extra: saldos[aluno.id] || 0,
    }));

    res.json(linhasComSaldo);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar alunos" });
  }
});

app.get("/coordenador/resultados/:coordenadorId", async (req, res) => {
  try {
    const coordenadorId = req.params.coordenadorId;
    const mes = req.query.mes;
    if (!mes) return res.status(400).json({ erro: "Mês não especificado" });

    const medalhasDoMes = await pool.query(
      `SELECT medalha.id
       FROM medalha JOIN missao ON missao.id = medalha.id_missao
       WHERE missao.ano = $1 AND missao.mes = $2`,
      [ANO_ATUAL, mes],
    );
    const medalhaIds = medalhasDoMes.rows.map((m) => m.id);

    const resultado = await pool.query(
      `SELECT a.id AS aluno_id, u.nome, ma.medalha_id, ma.checked
       FROM alunos a
       JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN medalha_aluno ma
         ON ma.aluno_id = a.id AND ma.medalha_id = ANY($2::int[])
       WHERE a.coordenador_id = $1
       ORDER BY u.nome`,
      [coordenadorId, medalhaIds],
    );

    const porAluno = {};
    resultado.rows.forEach((linha) => {
      if (!porAluno[linha.aluno_id]) {
        porAluno[linha.aluno_id] = {
          aluno_id: linha.aluno_id,
          nome: linha.nome,
          medalhas: [],
        };
      }
      if (linha.medalha_id) {
        porAluno[linha.aluno_id].medalhas.push({
          medalha_id: linha.medalha_id,
          checked: linha.checked,
        });
      }
    });

    res.json(Object.values(porAluno));
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar dados do mês" });
  }
});
app.post("/resultados", async (req, res) => {
  const { coordenadorId, ano, mes, dados } = req.body;

  if (!coordenadorId || !ano || !mes || !Array.isArray(dados)) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  try {
    const status = await statusMeses(coordenadorId);
    if (status.mes_lancavel !== mes) {
      return res
        .status(403)
        .json({ erro: "Este mês não está liberado para lançamento." });
    }

    for (const linhaAluno of dados) {
      const { aluno_id, medalhas } = linhaAluno;
      if (!Array.isArray(medalhas)) continue;

      for (const { medalha_id, checked } of medalhas) {
        await pool.query(
          `INSERT INTO medalha_aluno (medalha_id, aluno_id, checked, atualizado_em)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (medalha_id, aluno_id)
           DO UPDATE SET checked = EXCLUDED.checked, atualizado_em = now()`,
          [medalha_id, aluno_id, Boolean(checked)],
        );
      }

      await recalcularMedalhasDoAluno(aluno_id);
    }

    res.status(200).json({ mensagem: "Dados salvos com sucesso." });
  } catch (erro) {
    console.error("Erro ao salvar resultados:", erro);
    res
      .status(500)
      .json({ erro: "Erro ao salvar resultados.", detalhe: erro.message });
  }
});

async function recalcularMedalhasDoAluno(alunoId) {
  const totalResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM medalha_aluno ma
     JOIN medalha m ON m.id = ma.medalha_id
     JOIN missao mi ON mi.id = m.id_missao
     WHERE ma.aluno_id = $1 AND ma.checked = true AND mi.titulo <> 'Extra'`,
    [alunoId],
  );
  const totalResgates = await pool.query(
    `SELECT COUNT(*) AS total FROM medalha_resgatada WHERE aluno_id = $1`,
    [alunoId],
  );

  const totalMedalhas =
    Number(totalResult.rows[0].total) + Number(totalResgates.rows[0].total);

  const rank = calcularRank(totalMedalhas); // reaproveita a função que já existe no server.js

  await pool.query(
    `UPDATE alunos SET qtd_medalhas = $1, rank_atual = $2 WHERE id = $3`,
    [totalMedalhas, rank, alunoId],
  );
}

async function statusMesesAluno(alunoId) {
  const mesesCompletos = [];

  for (const mes of MESES_ORDEM) {
    const r = await pool.query(
      `SELECT 1 FROM resultados_mensais WHERE aluno_id = $1 AND mes = $2 LIMIT 1`,
      [alunoId, mes],
    );
    if (r.rows.length > 0) {
      mesesCompletos.push(mes);
    } else {
      break; // segue a ordem cronológica: para no primeiro mês sem dados
    }
  }

  const ultimoIndex = mesesCompletos.length - 1;
  const mesesBloqueados = MESES_ORDEM.filter((_, i) => i > ultimoIndex);

  return { meses_completos: mesesCompletos, meses_bloqueados: mesesBloqueados };
}

async function saldoMedalhaExtra(alunoId) {
  const ganhas = await pool.query(
    `SELECT COUNT(*) AS total FROM progresso_missoes WHERE aluno_id = $1 AND extra1 = true`,
    [alunoId],
  );

  const usadas = await pool.query(
    `SELECT COALESCE(SUM(quantidade), 0) AS total FROM medalhas_extras_utilizadas WHERE aluno_id = $1`,
    [alunoId],
  );

  const total = Number(ganhas.rows[0].total) - Number(usadas.rows[0].total);
  return Math.max(total, 0); // nunca negativo, por segurança
}
async function saldosMedalhaExtraEmLote(idsAlunos) {
  if (idsAlunos.length === 0) return {};

  const ganhas = await pool.query(
    `SELECT aluno_id, COUNT(*) AS total
     FROM progresso_missoes
     WHERE extra1 = true AND aluno_id = ANY($1::int[])
     GROUP BY aluno_id`,
    [idsAlunos],
  );
  const usadas = await pool.query(
    `SELECT aluno_id, COALESCE(SUM(quantidade), 0) AS total
     FROM medalhas_extras_utilizadas
     WHERE aluno_id = ANY($1::int[])
     GROUP BY aluno_id`,
    [idsAlunos],
  );

  const mapaGanhas = {};
  ganhas.rows.forEach((r) => (mapaGanhas[r.aluno_id] = Number(r.total)));

  const mapaUsadas = {};
  usadas.rows.forEach((r) => (mapaUsadas[r.aluno_id] = Number(r.total)));

  const saldos = {};
  idsAlunos.forEach((id) => {
    const saldo = (mapaGanhas[id] || 0) - (mapaUsadas[id] || 0);
    saldos[id] = Math.max(saldo, 0);
  });

  return saldos;
}

app.get("/aluno/meses/:alunoId", async (req, res) => {
  try {
    const alunoId = req.params.alunoId;
    const status = await statusMesesAluno(alunoId);
    res.json(status);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar meses do aluno" });
  }
});

// =====================
// ROTA: USAR MEDALHA EXTRA
// =====================
app.post("/usar-medalha-extra", async (req, res) => {
  const { alunoId, medalhaId } = req.body;

  if (!alunoId || !medalhaId) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  try {
    const medalhaResult = await pool.query(
      `SELECT ma.checked
       FROM medalha_aluno ma
       JOIN medalha m ON m.id = ma.medalha_id
       JOIN missao mi ON mi.id = m.id_missao
       WHERE ma.aluno_id = $1 AND ma.medalha_id = $2 AND mi.titulo = 'Extra'`,
      [alunoId, medalhaId],
    );

    if (medalhaResult.rows.length === 0 || !medalhaResult.rows[0].checked) {
      return res
        .status(400)
        .json({ erro: "Esta medalha extra ainda não foi conquistada." });
    }

    const jaResgatada = await pool.query(
      `SELECT 1 FROM medalha_resgatada WHERE aluno_id = $1 AND medalha_id = $2`,
      [alunoId, medalhaId],
    );
    if (jaResgatada.rows.length > 0) {
      return res
        .status(400)
        .json({ erro: "Esta medalha extra já foi resgatada." });
    }

    await pool.query(
      `INSERT INTO medalha_resgatada (medalha_id, aluno_id) VALUES ($1, $2)`,
      [medalhaId, alunoId],
    );

    await recalcularMedalhasDoAluno(alunoId);

    const alunoAtualizado = await pool.query(
      `SELECT qtd_medalhas FROM alunos WHERE id = $1`,
      [alunoId],
    );

    res.status(200).json({
      mensagem: "Medalha extra resgatada com sucesso.",
      qtd_medalhas: alunoAtualizado.rows[0].qtd_medalhas,
    });
  } catch (erro) {
    console.error("Erro ao resgatar medalha extra:", erro);
    res.status(500).json({ erro: "Erro ao resgatar medalha extra." });
  }
});

// =====================
// ROTA: ESTATÍSTICAS DO COORDENADOR
// =====================

// =====================
// ROTA: VERIFICAR STATUS DO MÊS
// =====================
app.get("/coordenador/status-mes/:coordenadorId", async (req, res) => {
  try {
    const coordenadorId = req.params.coordenadorId;
    const mes = req.query.mes;
    if (!mes) return res.status(400).json({ erro: "Mês não especificado" });

    const totalAlunosQuery = await pool.query(
      `SELECT COUNT(*) as total FROM alunos WHERE coordenador_id = $1`,
      [coordenadorId],
    );
    const totalAlunos = Number(totalAlunosQuery.rows[0].total);
    if (totalAlunos === 0) return res.json({ realizado: true });

    const realizado = await mesCompleto(coordenadorId, mes, totalAlunos);
    res.json({ realizado });
  } catch (erro) {
    console.error("Erro ao verificar status do mês:", erro);
    res.status(500).json({ erro: "Erro ao verificar status do mês" });
  }
});

const nodemailer = require("nodemailer");

async function enviarEmail(destinatario, senhaDoUsuario) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "suportemaisprogresso@gmail.com",
      pass: "zcwg ffra zfgt zrca",
    },
  });

  const info = await transporter.sendMail({
    from: "suportemaisprogresso@gmail.com",
    to: destinatario,
    subject: "Recuperação de senha - +Progresso",
    text: `Sua senha é: ${senhaDoUsuario}`,
  });

  console.log("E-mail enviado:", info.messageId);
}

app.post("/esqueci-senha", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: "E-mail não informado" });
    }

    const resultado = await pool.query(
      "SELECT senha FROM usuarios WHERE email = $1",
      [email],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: "E-mail não encontrado" });
    }

    const senhaAtual = resultado.rows[0].senha;

    await enviarEmail(email, senhaAtual);

    res.json({ mensagem: "E-mail enviado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Falha ao enviar e-mail" });
  }
});

// ── ROTA EXCLUSIVA PARA O SLIDER (BUSCA APENAS OS ALUNOS DO COORDENADOR) ──
app.get("/coordenador/alunos/:coordenadorId", async (req, res) => {
  try {
    const coordenadorId = req.params.coordenadorId;

    const resultado = await pool.query(
      `
      SELECT a.id, a.usuario_id, u.nome, a.rank_atual, a.qtd_medalhas, a.time
      FROM alunos a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.coordenador_id = $1
      ORDER BY u.nome
      `,
      [coordenadorId],
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar alunos" });
  }
});

// =====================
// ROTA: STATUS DE TODOS OS MESES (fundação p/ filtro e lançamento)
// =====================
app.get("/coordenador/meses/:coordenadorId", async (req, res) => {
  try {
    const coordenadorId = req.params.coordenadorId;
    const status = await statusMeses(coordenadorId);
    res.json(status);
  } catch (erro) {
    console.error("Erro ao buscar status dos meses:", erro);
    res.status(500).json({ erro: "Erro ao buscar status dos meses" });
  }
});

// PÓS REMODELAGEM DE DADOS

app.get("/missao/:ano/:mes", async (req, res) => {
  const { ano, mes } = req.params;
  try {
    const missoesResult = await pool.query(
      `SELECT id, titulo FROM missao WHERE ano = $1 AND mes = $2 ORDER BY id`,
      [ano, mes],
    );
    const missoes = missoesResult.rows;

    if (missoes.length === 0) {
      return res
        .status(404)
        .json({ erro: "Nenhuma missão cadastrada para este mês." });
    }

    const missaoIds = missoes.map((m) => m.id);
    const medalhasResult = await pool.query(
      `SELECT id, id_missao, nome, descricao_meta FROM medalha WHERE id_missao = ANY($1::int[]) ORDER BY id`,
      [missaoIds],
    );

    const catalogo = missoes.map((missao) => ({
      ...missao,
      medalhas: medalhasResult.rows.filter((m) => m.id_missao === missao.id),
    }));

    res.json(catalogo);
  } catch (erro) {
    console.error("Erro ao buscar missões:", erro);
    res.status(500).json({ erro: "Erro ao buscar missões." });
  }
});

app.get("/progresso/:alunoId", async (req, res) => {
  const { alunoId } = req.params;
  let { ano, mes } = req.query;

  try {
    const alunoResult = await pool.query(
      `SELECT rank_atual, qtd_medalhas FROM alunos WHERE id = $1`,
      [alunoId],
    );

    // Se o front não informar ano/mês, usa a missão mais recente cadastrada
    if (!ano || !mes) {
      const ultimaMissao = await pool.query(
        `SELECT ano, mes FROM missao ORDER BY id DESC LIMIT 1`,
      );
      if (ultimaMissao.rows.length === 0) {
        return res.json({
          aluno: alunoResult.rows[0] || null,
          missoes: [],
          saldo_medalha_extra: 0,
        });
      }
      ano = ultimaMissao.rows[0].ano;
      mes = ultimaMissao.rows[0].mes;
    }

    const missoesResult = await pool.query(
      `SELECT id, titulo FROM missao WHERE ano = $1 AND mes = $2 ORDER BY id`,
      [ano, mes],
    );
    const missoes = missoesResult.rows;
    const missaoIds = missoes.map((m) => m.id);

    const medalhasResult = missaoIds.length
      ? await pool.query(
          `SELECT id, id_missao, nome, descricao_meta FROM medalha WHERE id_missao = ANY($1::int[]) ORDER BY id`,
          [missaoIds],
        )
      : { rows: [] };
    const medalhaIds = medalhasResult.rows.map((m) => m.id);

    const progressoResult = medalhaIds.length
      ? await pool.query(
          `SELECT medalha_id, checked FROM medalha_aluno WHERE aluno_id = $1 AND medalha_id = ANY($2::int[])`,
          [alunoId, medalhaIds],
        )
      : { rows: [] };
    const checadoPorMedalha = {};
    progressoResult.rows.forEach((linha) => {
      checadoPorMedalha[linha.medalha_id] = linha.checked;
    });

    const resgatesResult = medalhaIds.length
      ? await pool.query(
          `SELECT medalha_id FROM medalha_resgatada WHERE aluno_id = $1 AND medalha_id = ANY($2::int[])`,
          [alunoId, medalhaIds],
        )
      : { rows: [] };
    const resgatadoPorMedalha = new Set(
      resgatesResult.rows.map((r) => r.medalha_id),
    );

    const dados = missoes.map((missao) => ({
      id: missao.id,
      titulo: missao.titulo,
      medalhas: medalhasResult.rows
        .filter((m) => m.id_missao === missao.id)
        .map((m) => ({
          id: m.id,
          nome: m.nome,
          descricao_meta: m.descricao_meta,
          checked: checadoPorMedalha[m.id] || false,
          resgatada: resgatadoPorMedalha.has(m.id),
        })),
    }));

    const saldoMedalhaExtra = dados
      .filter((missao) => missao.titulo === "Extra")
      .flatMap((missao) => missao.medalhas)
      .filter((medalha) => medalha.checked && !medalha.resgatada).length;

    res.json({
      aluno: alunoResult.rows[0] || null,
      ano,
      mes,
      missoes: dados,
      saldo_medalha_extra: saldoMedalhaExtra,
    });
  } catch (erro) {
    console.error("Erro ao buscar progresso do aluno:", erro);
    res.status(500).json({ erro: "Erro ao buscar progresso do aluno." });
  }
});

// =====================
// ROTA: VERIFICAR STATUS DO MÊS PARA O COORDENADOR
// =====================
// app.get("/coordenador/status-mes/:coordenadorId", async (req, res) => {
//   try {
//     const coordenadorId = req.params.coordenadorId;
//     const mes = req.query.mes; // Ex: "Abril", "Mai"

//     if (!mes) {
//       return res.status(400).json({ erro: "Mês não especificado" });
//     }

//     // 1. Conta o total de alunos que este coordenador possui
//     const totalQuery = await pool.query(
//       `SELECT COUNT(*) as total FROM alunos WHERE coordenador_id = $1`,
//       [coordenadorId],
//     );
//     const totalAlunos = Number(totalQuery.rows[0].total);

//     // Se o coordenador não tiver alunos, consideramos o mês como concluído (vazio)
//     if (totalAlunos === 0) {
//       return res.json({ concluido: true });
//     }

//     // 2. Conta quantos alunos deste coordenador já têm dados lançados no mês solicitado
//     const lancamentosQuery = await pool.query(
//       `
//       SELECT COUNT(DISTINCT aluno_id) as total
//       FROM resultados_mensais
//       WHERE mes = $1
//       AND aluno_id IN (SELECT id FROM alunos WHERE coordenador_id = $2)
//       `,
//       [mes, coordenadorId],
//     );
//     const lancamentos = Number(lancamentosQuery.rows[0].total);

//     // 3. Verifica se a quantidade de lançamentos é igual ao total de alunos
//     const concluido = lancamentos === totalAlunos;

//     res.json({ concluido });
//   } catch (erro) {
//     console.error("Erro ao verificar status do mês:", erro);
//     res.status(500).json({ erro: "Erro ao verificar status do mês" });
//   }
// });

// =====================
// SERVIDOR
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
