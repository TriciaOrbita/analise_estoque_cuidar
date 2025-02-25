import React, { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress, Collapse, Box, Typography } from "@mui/material";

interface Entrada {
  data: string;
  quantidade: number;
  lote: string;
}

interface Saida {
  data: string;
  unidade: string;
  quantidade: number;
  lote: string;
}

interface Item {
  material: string;
  entradas: Entrada[];
  saidas: Saida[];
}

const SaldoTabela: React.FC = () => {
  const [dados, setDados] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("https://apianaliseestoque-production.up.railway.app/dados")
      .then((res) => {
        setDados(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar os dados");
        setLoading(false);
      });
  }, []);

  const calcularSaldos = () => {
    const saldoMap = new Map<string, { material: string; lote: string; entradaTotal: number; saidaTotal: number; saldo: number; unidades: Map<string, { quantidade: number; data: string }> }>();

    dados.forEach(({ material, entradas, saidas }) => {
      const lotesComEntrada = new Set(entradas.map(({ lote }) => lote));

      entradas.forEach(({ lote, quantidade }) => {
        const key = `${material}-${lote}`;
        if (!saldoMap.has(key)) {
          saldoMap.set(key, { material, lote, entradaTotal: 0, saidaTotal: 0, saldo: 0, unidades: new Map() });
        }
        saldoMap.get(key)!.entradaTotal += quantidade;
      });

      saidas.forEach(({ lote, quantidade, unidade, data }) => {
        if (!lotesComEntrada.has(lote)) return;
        const key = `${material}-${lote}`;
        if (!saldoMap.has(key)) {
          saldoMap.set(key, { material, lote, entradaTotal: 0, saidaTotal: 0, saldo: 0, unidades: new Map() });
        }
        saldoMap.get(key)!.saidaTotal += quantidade;

        const unidadesMap = saldoMap.get(key)!.unidades;
        if (unidadesMap.has(unidade)) {
          unidadesMap.set(unidade, { quantidade: unidadesMap.get(unidade)!.quantidade + quantidade, data });
        } else {
          unidadesMap.set(unidade, { quantidade, data });
        }
      });
    });

    saldoMap.forEach((value) => {
      value.saldo = value.entradaTotal - value.saidaTotal;
    });

    return Array.from(saldoMap.values())
      .filter(({ saldo, unidades }) => saldo > 0 && unidades.size > 0)
      .map((item) => ({
        ...item,
        unidades: Array.from(item.unidades)
          .map(([unidade, { quantidade, data }]) => `${data} - ${unidade}: ${quantidade}`)
          .join(", "),
      }));
  };

  const saldos = calcularSaldos();

  if (loading) return <div className="loading"><CircularProgress /></div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <Box sx={{ padding: 2, maxWidth: 1200, margin: '0 auto', backgroundColor: '#ffffff' }}>
      {saldos.map(({ material, lote, entradaTotal, saidaTotal, saldo, unidades }) => (
        <Box key={`${material}-${lote}`} sx={{ marginBottom: 2 }}>
          <Box
            onClick={() => setExpandedRow(expandedRow === `${material}-${lote}` ? null : `${material}-${lote}`)}
            sx={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: 2,
              marginBottom: 2,
              padding: 2,
              display: 'flex',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.3s, transform 0.3s',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'scale(1.03)', // Animação de escala ao passar o mouse
              },
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 'bold' }}>
              {material} - {lote} - Entrada: {entradaTotal} - Saída: {saidaTotal} - Quantidade Total: {saldo}
            </Typography>
          </Box>
          <Collapse in={expandedRow === `${material}-${lote}`}>
            <Box sx={{ paddingLeft: 2, marginTop: 1 }}>
              {unidades ? (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', marginBottom: 1 }}>
                    Unidades que tiveram saídas e quantidade
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 300, // Defina o tamanho máximo para a área rolável
                      overflowY: 'auto', // Permite rolagem vertical
                      paddingRight: 1,
                    }}
                  >
                    {unidades.split(", ").map((unidade, index) => (
                      <Box
                        key={index}
                        sx={{
                          backgroundColor: '#e2fde0', // Fundo claro para separar os itens
                          borderRadius: 4, // Bordas arredondadas
                          padding: 1.5, // Espaçamento interno
                          marginBottom: 1, // Espaçamento entre os itens
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)', // Sombra suave para destaque
                        }}
                      >
                        <Typography sx={{ fontSize: 16, color: '#555' }}>
                          {unidade}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography sx={{ fontSize: 16, color: '#777' }}>Nenhuma</Typography>
              )}
            </Box>
          </Collapse>
        </Box>
      ))}
    </Box>
  );
};

export default SaldoTabela;
