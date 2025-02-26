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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
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

  const toggleExpand = (material: string) => {
    setExpandedItems((prev) =>
      prev.includes(material) ? prev.filter((item) => item !== material) : [...prev, material]
    );
  };

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
  <div className="p-4" style={{ backgroundColor: '#f0f8f5' }}> 
    {/* Título */}
    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#064e3b', marginTop: 5 }}>
      Resumo de Saídas do Estoque
    </Typography>
    
    {/* Abas */}
    <AppBar position="static" sx={{ borderRadius: 2, backgroundColor: '#064e3b' }}>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        sx={{
          "& .MuiTab-root": {
            fontWeight: 'bold',
            color: '#ffffff',
            borderBottom: '3px solid transparent',
            transition: 'border-color 0.3s',
          },
          "& .MuiTab-root:hover": {
            backgroundColor: '#065f46',
            color: '#d1fae5',
          },
          "& .Mui-selected": {
            borderBottom: '3px solid #a7f3d0',
            color: '#d1fae5'
          },
        }}
      >
        <Tab label="Saldo Estoque" />
        <Tab label="Entradas - CAF" />
        <Tab label="Saídas - Unidades" />
      </Tabs>
    </AppBar>

    {/* Conteúdo das Abas */}
{tabIndex === 1 && (
  <Box sx={{ mt: 2, maxHeight: 700, overflowY: "auto", borderRadius: 2, backgroundColor: "#ffffff", padding: 2 }}>
    <Typography variant="h5" sx={{ fontWeight: "bold", color: "#064e3b", marginBottom: 2 }}>
      Tabela de Entradas na CAF
    </Typography>
    {dadosFiltrados.map((item) => (
      <Box key={item.material} sx={{ mb: 4, backgroundColor: "#ffffff", borderRadius: 2, padding: 2, boxShadow: 2 }}>
        {/* Nome do Material - Clicável */}
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "#064e3b", cursor: "pointer" }}
          onClick={() => toggleExpand(item.material)}
        >
          {item.material}
        </Typography>

        {/* Renderiza a tabela apenas se o item estiver expandido */}
        {expandedItems.includes(item.material) && (
          <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 1 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#34d399" }}>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Lote</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.entradas.map((entrada, index) => (
                  <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#ffffff" } }}>
                    <TableCell>{entrada.data}</TableCell>
                    <TableCell>{entrada.quantidade}</TableCell>
                    <TableCell>{entrada.lote}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    ))}
  </Box>
)}

{/* Conteúdo da Tab de Saídas */}
{tabIndex === 2 && (
  <Box sx={{ mt: 2, maxHeight: 700, overflowY: "auto", borderRadius: 2, backgroundColor: "#ffffff", padding: 2 }}>
    <Typography variant="h5" sx={{ fontWeight: "bold", color: "#064e3b", marginBottom: 2 }}>
      Tabela de Saídas das Unidades
    </Typography>
    {dadosFiltrados.map((item) => (
      <Box key={item.material} sx={{ mb: 4, backgroundColor: "#ffffff", borderRadius: 2, padding: 2, boxShadow: 2 }}>
        {/* Nome do Material - Clicável */}
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "#065f46", cursor: "pointer" }}
          onClick={() => toggleExpand(item.material)}
        >
          {item.material}
        </Typography>

        {/* Renderiza a tabela apenas se o item estiver expandido */}
        {expandedItems.includes(item.material) && (
          <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 1 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#34d399" }}>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Unidade</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Lote</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.saidas
                  .filter((saida) => saida.quantidade && Number(saida.quantidade) > 0)
                  .map((saida, index) => (
                    <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#ffffff" } }}>
                      <TableCell>{saida.data}</TableCell>
                      <TableCell>{saida.unidade}</TableCell>
                      <TableCell>{saida.quantidade}</TableCell>
                      <TableCell>{saida.lote}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    ))}
  </Box>
)}

    {/* Saldo Estoque */}
    {tabIndex === 0 && (
      <Box sx={{ maxHeight: 700, width: 1200, overflowY: "auto", overflowX: "auto", borderRadius: 2, backgroundColor: '#ffffff', padding: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#064e3b', marginBottom: 2 }}>
          Saldo em Estoque após saídas
        </Typography>
        <SaldoTabela />
      </Box>
    )}

    {/* Rodapé */}
    <footer className="footer" style={{ textAlign: 'center', padding: 10, backgroundColor: '#065f46', color: '#d1fae5', borderRadius: 4 }}>
      <p>Desenvolvido por Órbita Tecnologia</p>
    </footer>
  </div>
);
}