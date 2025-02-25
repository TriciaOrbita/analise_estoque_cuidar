import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import {Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,Typography,Box,Tabs,Tab,AppBar,Select,MenuItem,FormControl,InputLabel,} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import SaldoTabela from "../components/SaldoTabela";

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
  entradaTotal: number;
  saidaTotal: number;
  saldo: number;
  entradas: Entrada[];
  saidas: Saida[];
}
  

export default function Dashboard() {
  const [dados, setDados] = useState<Item[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  
  useEffect(() => {
    axios.get("https://apianaliseestoque-production.up.railway.app/dados").then((res) => setDados(res.data));
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleUnidadeChange = (event: SelectChangeEvent) => {
    setUnidadeSelecionada(event.target.value);
  };

  const unidades = Array.from(new Set(dados.flatMap(item => item.saidas.map(saida => saida.unidade))));

  const dadosFiltrados = unidadeSelecionada 
    ? dados.map(item => ({
        ...item,
        saidas: item.saidas.filter(saida => saida.unidade === unidadeSelecionada)
      }))
    : dados;

  const dataForChart = dadosFiltrados.flatMap((item) => {
    return [
      ...item.entradas.map((entrada) => ({
        data: entrada.data,
        quantidade: entrada.quantidade,
        tipo: "Entrada",
      })),
      ...item.saidas.map((saida) => ({
        data: saida.data,
        quantidade: saida.quantidade,
        tipo: "Saída",
      })),
      
    ];
  });

  const dataForChartGrouped: {
    data: string;
    entradas: number;
    saidas: number;
    materiais: Record<string, { entradas: number; saidas: number }>;
  }[] = [];
  
  // Processa as ENTRADAS e SAÍDAS juntas para agrupar por data
  dadosFiltrados.forEach((item) => {
    [...item.entradas, ...item.saidas].forEach((movimentacao) => {
      const isEntrada = "unidade" in movimentacao; // Diferenciar entrada de saída
  
      let existingEntry = dataForChartGrouped.find((d) => d.data === movimentacao.data);
  
      if (!existingEntry) {
        existingEntry = {
          data: movimentacao.data,
          entradas: 0,
          saidas: 0,
          materiais: {},
        };
        dataForChartGrouped.push(existingEntry);
      }
  
      if (!existingEntry.materiais[item.material]) {
        existingEntry.materiais[item.material] = { entradas: 0, saidas: 0 };
      }
  
      if (isEntrada) {
        existingEntry.entradas += movimentacao.quantidade;
        existingEntry.materiais[item.material].entradas += movimentacao.quantidade;
      } else {
        existingEntry.saidas += movimentacao.quantidade;
        existingEntry.materiais[item.material].saidas += movimentacao.quantidade;
      }
    });
  });


  // --------------------------------------------------------------------
const groupedData = dataForChart.reduce((acc, curr) => {
    // Verifica se já existe o item para a data
    const key = curr.data;
    if (!acc[key]) {
      acc[key] = { data: curr.data, entradas: 0, saidas: 0 };
    }
    
    // Acumula as quantidades de entradas e saídas
    if (curr.tipo === "Entrada") {
      acc[key].entradas += curr.quantidade;
    } else if (curr.tipo === "Saída") {
      acc[key].saidas += curr.quantidade;
    }
    
    return acc;
  }, {});
  
  // Transformando o objeto agrupado de volta em um array
  const finalDataForChart = Object.values(groupedData);

  const totalEntradas = dataForChart
    .filter((item) => item.tipo === "Entrada")
    .reduce((acc, curr) => acc + curr.quantidade, 0);

  const totalSaidas = dataForChart
    .filter((item) => item.tipo === "Saída")
    .reduce((acc, curr) => acc + curr.quantidade, 0);

    const totaisPorUnidade: Record<string, { entradas: number; saidas: number }> = {};

    dados.forEach((item) => {
      item.saidas.forEach((saida) => {
        if (!totaisPorUnidade[saida.unidade]) {
          totaisPorUnidade[saida.unidade] = { entradas: 0, saidas: 0 };
        }
        totaisPorUnidade[saida.unidade].saidas += saida.quantidade;
      });
    
      item.entradas.forEach(() => {
        if (!totaisPorUnidade["Geral"]) {
          totaisPorUnidade["Geral"] = { entradas: 0, saidas: 0 };
        }
        totaisPorUnidade["Geral"].entradas += item.entradaTotal;
      });
    });    

    return (
      <div className="p-4">
        {/* Título */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333', marginTop: 5 }}>
          Resumo de Saídas do Estoque
        </Typography>
        
        {/* Abas */}
        <AppBar position="static" sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            sx={{
              backgroundColor: '#f5f5f5',
              color: '#007a10', // Cor do texto da aba
              "& .MuiTab-root": {
                fontWeight: 'bold', // Fonte em negrito
                color: '#007a10', // Cor do texto das abas
                borderBottom: '3px solid transparent', // Linha invisível no fundo
                transition: 'border-color 0.3s', // Animação suave para a linha
              },
              "& .MuiTab-root:hover": {
                backgroundColor: '#e0e0e0', // Cor de fundo no hover
                color: '#007a10', // Cor do texto no hover (verde)
              },
              "& .Mui-selected": {
                borderBottom: '3px solid #007a10', // Linha verde quando a aba estiver selecionada
              },
            }}
          >
            <Tab label="Saldo Estoque" />
            <Tab label="Entradas - CAF" />
            <Tab label="Saídas - Unidades" />
          </Tabs>
        </AppBar>

    
        {/* Conteúdo da Tab 1: Tabela de Entradas */}
        {tabIndex === 1 && (
          <Box sx={{ mt: 2, maxHeight: 700, overflowY: "auto", borderRadius: 2, backgroundColor: '#fff', padding: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
              Tabela de Entradas na CAF
            </Typography>
            {dadosFiltrados.map((item) => (
              <Box key={item.material} sx={{ mb: 4, backgroundColor: '#f9f9f9', borderRadius: 2, padding: 2, boxShadow: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555' }}>
                  {item.material}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Quantidade</TableCell>
                        <TableCell>Lote</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.entradas.map((entrada, index) => (
                        <TableRow key={index}>
                          <TableCell>{entrada.data}</TableCell>
                          <TableCell>{entrada.quantidade}</TableCell>
                          <TableCell>{entrada.lote}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        )}
    
        {/* Conteúdo da Tab 2: Tabela de Saídas */}
        {tabIndex === 2 && (
          <Box sx={{ mt: 2, maxHeight: 700, overflowY: "auto", borderRadius: 2, backgroundColor: '#fff', padding: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
              Tabela de Saídas das Unidades
            </Typography>
            {dadosFiltrados.map((item) => (
              <Box key={item.material} sx={{ mb: 4, backgroundColor: '#f9f9f9', borderRadius: 2, padding: 2, boxShadow: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555' }}>
                  {item.material}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Unidade</TableCell>
                        <TableCell>Quantidade</TableCell>
                        <TableCell>Lote</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.saidas
                        .filter((saida) => saida.quantidade && Number(saida.quantidade) > 0) // Filtra valores não numéricos e zero
                        .map((saida, index) => (
                          <TableRow key={index}>
                            <TableCell>{saida.data}</TableCell>
                            <TableCell>{saida.unidade}</TableCell>
                            <TableCell>{saida.quantidade}</TableCell>
                            <TableCell>{saida.lote}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        )}
    
        {/* Conteúdo da Tab 0: Saldo em Estoque */}
        {tabIndex === 0 && (
          <Box sx={{ mt: 2, maxHeight: 700, width: 1200, overflowY: "auto", overflowX: "auto", borderRadius: 2, backgroundColor: '#fff', padding: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
              Saldo em Estoque após saídas
            </Typography>
            <SaldoTabela />
          </Box>
        )}
    
        <footer className="footer">
                  <p>Desenvolvido por Órbita Tecnologia</p>
                </footer>
      </div>
      
    );    
}