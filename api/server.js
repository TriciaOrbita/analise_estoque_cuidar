const { Pool } = require('pg');  // Para a conexão com PostgreSQL
const cors = require('cors');
const express = require('express');

// Inicializando a aplicação Express
const app = express();

// Conexão com o banco PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '35.199.90.104',
  database: 'farmacia',
  password: 'esus',
  port: 5433,
});

// Configuração do CORS
app.use(cors());

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

// Função que o Vercel usará para rodar a API
module.exports = app;
