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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}><CircularProgress /></div>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;

  return (
    <Box sx={{ padding: 1, maxWidth: 1200, margin: '0 auto', backgroundColor: '#f9fafb' }}>
      {saldos.map(({ material, lote, entradaTotal, saidaTotal, saldo, unidades }) => (
        <Box key={`${material}-${lote}`} sx={{ marginBottom: 2 }}>
          <Box
            onClick={() => setExpandedRow(expandedRow === `${material}-${lote}` ? null : `${material}-${lote}`)}
            sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: 3,
              padding: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 'bold', color: '#37513b' }}>
              {material} - {lote} - Entrada: {entradaTotal} - Saída: {saidaTotal} - Saldo: {saldo}
            </Typography>
          </Box>
          <Collapse in={expandedRow === `${material}-${lote}`}>
            <Box sx={{ padding: 2, backgroundColor: '#ffffff', borderRadius: 2, marginTop: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1eaf36', marginBottom: 1 }}>
                Unidades e quantidades
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', paddingRight: 1, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#006b0e', borderRadius: 3 } }}>
                {unidades.split(", ").map((unidade, index) => (
                  <Box
                    key={index}
                    sx={{
                      backgroundColor: '#e6fde8',
                      borderRadius: 4,
                      padding: 1.5,
                      marginBottom: 1,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography sx={{ fontSize: 16, color: '#023b13' }}>{unidade}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </Box>
      ))}
    </Box>
  );
};

export default SaldoTabela;
