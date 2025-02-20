const express = require('express');
const { Pool } = require('pg');  // Para a conexão com PostgreSQL
const cors = require('cors');

// Inicializando a aplicação Express
const app = express();
const port = 3000;

// Configuração do CORS
app.use(cors());

// Conexão com o banco PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '35.199.90.104',
  database: 'farmacia',
  password: 'esus',
  port: 5433,
});

// Rota para obter as unidades válidas
app.get('/unidades', async (req, res) => {
  try {
    const query = `
      SELECT nome
      FROM local
      WHERE nome NOT IN ('UPA Central', 'UPA Norte', 'Orbita', 'Unidade Condor2 22', 'Unidade teste 01', 'Unidade teste 02')
    `;
    const result = await pool.query(query);
    const unidadesValidas = result.rows.map(row => row.nome);
    res.json({ unidades: unidadesValidas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao obter unidades');
  }
});

// Rota para obter estoque de uma unidade
app.get('/estoque/:unidade', async (req, res) => {
  const { unidade } = req.params;
  const { page = 1, page_size = 5000 } = req.query;

  try {
    const query = `
      SELECT nome
      FROM local
      WHERE nome NOT IN ('UPA Central', 'UPA Norte', 'Orbita', 'Unidade Condor2 22', 'Unidade teste 01', 'Unidade teste 02', 'CAF')
    `;
    const result = await pool.query(query);
    const unidadesValidas = result.rows.map(row => row.nome);

    if (!unidadesValidas.includes(unidade)) {
      return res.status(400).json({ error: 'Unidade inválida ou não encontrada' });
    }

    const offset = (page - 1) * page_size;
    const estoqueQuery = `
      SELECT id, nome_medicamento, saldo_estoque, unidade, lote, data_movimentacao
      FROM vi_extrato_estoque 
      WHERE unidade = $1
      LIMIT $2 OFFSET $3
    `;
    const estoqueResult = await pool.query(estoqueQuery, [unidade, page_size, offset]);

    if (estoqueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum item encontrado para esta unidade' });
    }

    const estoque = estoqueResult.rows.map(item => ({
      ...item,
      data_movimentacao: item.data_movimentacao ? item.data_movimentacao.toISOString() : null,
      saldo_estoque: Math.max(item.saldo_estoque, 0),
    }));

    res.json(estoque);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

// Rota para obter estoque da unidade 'CAF'
app.get('/estoque/CAF', async (req, res) => {
  const { page = 1, page_size = 5000 } = req.query;

  try {
    const unidade = 'CAF';  // A unidade agora é fixa como 'CAF'

    const query = `
      SELECT nome
      FROM local
      WHERE nome NOT IN ('UPA Central', 'UPA Norte', 'Orbita', 'Unidade Condor2 22', 'Unidade teste 01', 'Unidade teste 02')
    `;
    const result = await pool.query(query);
    const unidadesValidas = result.rows.map(row => row.nome);

    if (!unidadesValidas.includes(unidade)) {
      return res.status(400).json({ error: "Unidade 'CAF' não encontrada" });
    }

    const offset = (page - 1) * page_size;
    const estoqueQuery = `
      SELECT id, nome_medicamento, saldo_estoque, unidade, lote, data_movimentacao
      FROM vi_extrato_estoque 
      WHERE unidade = $1
      LIMIT $2 OFFSET $3
    `;
    const estoqueResult = await pool.query(estoqueQuery, [unidade, page_size, offset]);

    if (estoqueResult.rows.length === 0) {
      return res.status(404).json({ error: "Nenhum item encontrado para a unidade CAF" });
    }

    const estoque = estoqueResult.rows.map(item => ({
      ...item,
      data_movimentacao: item.data_movimentacao ? item.data_movimentacao.toISOString() : null,
      saldo_estoque: Math.max(item.saldo_estoque, 0),
    }));

    res.json(estoque);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar estoque da CAF' });
  }
});

// Rota para somar o saldo de estoque de cada unidade
app.get('/saldo_total', async (req, res) => {
  try {
    const query = `
      SELECT unidade, SUM(saldo_estoque) as total_saldo_estoque
      FROM vi_extrato_estoque
      GROUP BY unidade
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum saldo de estoque encontrado' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao somar saldo de estoque' });
  }
});

// Inicia o servidor na porta configurada
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
