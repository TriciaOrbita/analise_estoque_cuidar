import { useState, useEffect } from "react";
import axios from "axios";
import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaTimesCircle } from "react-icons/fa";
import "../styles.css";
import * as XLSX from 'xlsx';

// Interface para os dados do estoque
interface EstoqueItem {
  nome_medicamento: string;
  estoque_atual: number;
  lote?: string;
  data_atualizacao: string;
  local: string;
  id: number;
  quantidade_saida: number;
  quantidade: number;
}

export default function EstoqueTable() {
  const [unidades, setUnidades] = useState<string[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [quantidadesMinimas, setQuantidadesMinimas] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState<string>(""); // Estado para o termo de pesquisa
  const [filtroIndisponivel, setFiltroIndisponivel] = useState<boolean>(false);
  const [filtroBaixo, setFiltroBaixo] = useState<boolean>(false);
  const [filtroCritco, setFiltroCritco] = useState<boolean>(false);

  // Carregar unidades
useEffect(() => {
  setLoading(true);
  setError(null);
  axios
    .get("https://apianaliseestoque-production.up.railway.app/unidades")
    .then((response) => {
      if (response.data && Array.isArray(response.data.unidades)) {
        setUnidades(response.data.unidades);
      } else {
        setError("Formato de dados inválido.");
      }
      setLoading(false);
    })
    .catch(() => {
      setError("Erro ao carregar unidades");
      setLoading(false);
    });
}, []);

// Carregar estoque ao selecionar unidade
useEffect(() => {
  if (!unidadeSelecionada) return;
  setLoading(true);
  setEstoque([]);
  setError(null);

  axios
    .get(`https://apianaliseestoque-production.up.railway.app/estoque/${unidadeSelecionada}`)
    .then((response) => {
      if (response.data && Array.isArray(response.data)) {
        setEstoque(response.data);
      } else {
        setError("Formato de dados inválido.");
      }
      setLoading(false);
    })
    .catch(() => {
      setError("Erro ao carregar dados de estoque");
      setLoading(false);
    });
}, [unidadeSelecionada]);

// Carregar o JSON de quantidades mínimas
const carregarJsonPorUnidade = (unidade: string) => {
  // Verifica o nome da unidade e escolhe o JSON correto
  if (unidade.includes("UPA") || unidade.includes("Hospital")) {
    return "/quantidades_minimas_porte2.json"; // Para UPA ou Hospital
  } else if (unidade.includes("UBS") || unidade.includes("Unidade Básica de Saúde")) {
    return "/quantidades_minimas_porte1.json"; // Para UBS ou Unidade Básica de Saúde
  }
  return "/quantidades_minimas_porte1.json"; // Padrão, caso nenhum dos outros casos
};

useEffect(() => {
  // Carrega o arquivo JSON baseado na unidade
  const arquivoJson = carregarJsonPorUnidade(unidadeSelecionada);
  axios
    .get(arquivoJson)
    .then((response) => {
      console.log(response.data);  // Adicione este log
      setQuantidadesMinimas(response.data);
    })
    .catch((err) => {
      setError("Erro ao carregar o arquivo de quantidades mínimas.");
      console.error(err);
    });
}, [unidadeSelecionada]); // Recarregar sempre que a unidade mudar

  const calcularStatus = (nomeMedicamento: string, estoqueAtual: number) => {
        const nomeMedicamentoLower = nomeMedicamento.toLowerCase();
    
        // Filtrar correspondências no JSON
        const correspondencias = Object.keys(quantidadesMinimas).filter((medicamento) =>
          nomeMedicamentoLower.includes(medicamento.toLowerCase())
        );
    
        // Define uma quantidade mínima padrão caso não seja encontrada no JSON
        const minQuantidade = correspondencias.length === 0 ? 50 : quantidadesMinimas[correspondencias[0]];
  
        const estoqueAtualNumerico = Number(estoqueAtual);
    
        if (estoqueAtualNumerico  <= 0) {
          return { status: "Indisponível", color: "red", icon: <FaTimesCircle />, minQuantidade };
        }
        if (estoqueAtual > minQuantidade) {
          return { status: "OK", color: "green", icon: <FaCheckCircle/>, minQuantidade };
        }
        
        if (estoqueAtual >= minQuantidade * 0.5) {
          return { 
            status: "Baixo", 
            color: "gold", 
            icon: <FaExclamationTriangle />, 
            minQuantidade 
          };
        }      
        return { 
          status: "Crítico", 
          color: "tomato", 
          icon: <FaExclamationCircle style={{ color: "darkorange" }} />,  // Ícone laranja
          style: { color: "black", fontWeight: "bold" },  // Texto preto
          minQuantidade 
        };
      };
  
    const calcularStatus2 = (nomeMedicamento: string, estoqueAtual: number) => {
      const nomeMedicamentoLower = nomeMedicamento.toLowerCase();
  
      // Filtrar correspondências no JSON
      const correspondencias = Object.keys(quantidadesMinimas).filter((medicamento) =>
        nomeMedicamentoLower.includes(medicamento.toLowerCase())
      );
  
      // Define uma quantidade mínima padrão caso não seja encontrada no JSON
      const minQuantidade = correspondencias.length === 0 ? 50 : quantidadesMinimas[correspondencias[0]];
      const estoqueAtualNumerico = Number(estoqueAtual);
  
      // Retorna o status dependendo do estoque
      if (estoqueAtualNumerico  <= 0) {
        return { status: "Indisponível", color: "black", icon: <FaTimesCircle style={{ color: "red" }} />, minQuantidade };
      }
      if (estoqueAtual > minQuantidade) {
        return { status: "OK", color: "black", icon: <FaCheckCircle style={{ color: "green" }} />, minQuantidade };
      }
      if (estoqueAtual >= minQuantidade * 0.5) {
        return { status: "Baixo", color: "black", icon: <FaExclamationTriangle style={{ color: "gold" }} />, minQuantidade };
      }
      return { status: "Crítico", color: "black", icon: <FaExclamationCircle style={{ color: "darkorange" }} />, minQuantidade };
    };
  
  // Funções para alternar os filtros
  const toggleFiltroIndisponivel = () => {
    if (filtroIndisponivel) {
      setFiltroIndisponivel(false);  // Desmarcar o filtro e mostrar todos
    } else {
      setFiltroIndisponivel(true);  // Ativar o filtro e desmarcar os outros
      setFiltroBaixo(false);
      setFiltroCritco(false);
    }
  };
  
  const toggleFiltroBaixo = () => {
    if (filtroBaixo) {
      setFiltroBaixo(false);  // Desmarcar o filtro e mostrar todos
    } else {
      setFiltroBaixo(true);  // Ativar o filtro e desmarcar os outros
      setFiltroIndisponivel(false);
      setFiltroCritco(false);
    }
  };
  
  const toggleFiltroCritico = () => {
    if (filtroCritco) {
      setFiltroCritco(false);  // Desmarcar o filtro e mostrar todos
    } else {
      setFiltroCritco(true);  // Ativar o filtro e desmarcar os outros
      setFiltroIndisponivel(false);
      setFiltroBaixo(false);
    }
  };
  
  let estoqueFiltrado = estoque.filter((item) => {
    if (!item.nome_medicamento || item.nome_medicamento.trim() === "") return false;
  
    const { status } = calcularStatus2(item.nome_medicamento, item.estoque_atual);
  
    // Aplica os filtros corretamente
    if (filtroIndisponivel && status !== "Indisponível") return false;
    if (filtroBaixo && status !== "Baixo") return false;
    if (filtroCritco && status !== "Crítico") return false;
  
    return true;
  });
  
  
    // Aplicar filtro de pesquisa
  
    const exportarParaExcel = () => {
      // Cria um array com os dados da tabela
      const dados = estoqueFiltrado.map((item) => {
        return {
          "Nome do Item": item.nome_medicamento,
          "Quantidade": item.quantidade,
          "Quantidade Saída": item.quantidade_saida,
          "Quantidade Total": item.estoque_atual,
          "Lote": item.lote || "N/A",
          "Data de Movimentação": item.data_atualizacao,
          "Local": item.local,
          "Status": calcularStatus2(item.nome_medicamento, item.estoque_atual).status,
        };
      });
    
      // Cria uma planilha a partir dos dados
      const ws = XLSX.utils.json_to_sheet(dados);
    
      // Cria um novo livro de trabalho
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
    
      // Gera o arquivo Excel e dispara o download
      XLSX.writeFile(wb, 'estoque.xlsx');
    };
  
  return (
    <>
      <div className="estoque-geral-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando unidades...</p>
          </div>
        ) : (
          <div className="page-content">
            {!loading && unidades.length > 0 && (
              <select
                className="estoque-select"
                value={unidadeSelecionada}
                onChange={(e) => setUnidadeSelecionada(e.target.value)}
              >
                <option value="">Selecione uma unidade</option>
                {unidades.map((unidade, index) => (
                  <option key={index} value={unidade}>
                    {unidade}
                  </option>
                ))}
              </select>
            )} 

            {unidadeSelecionada && (
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Pesquisar item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
  
                {unidadeSelecionada && (
                <div className="filtro-container">

                  <button onClick={toggleFiltroIndisponivel}>
                    {filtroIndisponivel ? "Mostrar Todos" : "Mostrar Indisponíveis"}
                    <div className="info-container">
                      <i className="info-icon">i</i>
                      <div className="info-text">
                        Filtro para mostrar itens indisponíveis em estoque.
                      </div>
                    </div>
                  </button>

                  <button onClick={toggleFiltroBaixo}>
                    {filtroBaixo ? "Mostrar Todos" : "Mostrar Estado Baixo"}
                    <div className="info-container">
                      <i className="info-icon">i</i>
                      <div className="info-text">
                        Filtro para mostrar itens com estoque baixo.
                      </div>
                    </div>
                  </button>

                  <button onClick={toggleFiltroCritico}>
                    {filtroCritco ? "Mostrar Todos" : "Mostrar Estado Crítico"}
                    <div className="info-container">
                      <i className="info-icon">i</i>
                      <div className="info-text">
                        Filtro para mostrar itens em estado crítico de estoque.
                      </div>
                    </div>
                  </button>

                  <button onClick={exportarParaExcel}>Exportar</button>
                </div>
              )}
  
            {/* Exibe o estoque se a unidade for selecionada e o estoque estiver disponível */}
            {unidadeSelecionada && estoqueFiltrado.length > 0 && (
              <div>
              <h2>
                Estoque de {unidadeSelecionada}
                <div className="info-container">
                  <i className="info-icon">i</i>
                  <div className="info-text">
                    Você pode visualizar os itens e suas quantidades em estoque, ver o status baseado na quantidade existente e utilizar os filtros para analisar melhor.
                  </div>
                </div>
              </h2>
            
  
                {/* Tabela de Estoque */}
                <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <h3>Tabela de Saldo em Estoque</h3>
                </div>
                <div className="estoque-tabela-container">
                  <table className="estoque-table">
                    <thead>
                      <tr>
                        <th>Nome do Item</th>
                        <th>Saldo em Estoque</th>
                        <th>Lote</th>
                        <th>Data de Movimentação</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                    {estoqueFiltrado
                      .filter((item) =>
                        item.nome_medicamento.toLowerCase().includes(searchTerm.toLowerCase())
                      ) // Aplica o filtro de pesquisa
                      .map((item) => {
                        const status = calcularStatus2(item.nome_medicamento, item.estoque_atual);
                        return (
                          <>
                          <tr key={item.id} style={{ backgroundColor: status.color + "30" }}>
                            <td>{item.nome_medicamento}</td>
                            <td>{item.estoque_atual}</td>
                            <td>{item.lote || "N/A"}</td>
                            <td>{item.data_atualizacao}</td>
                            <td style={{ color: status.color }}>
                              {status.icon} {status.status}
                            </td>
                          </tr>
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
  
                {/* Barra de Progresso */}
                <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <h3>Barras de Progresso Quantidade em Estoque</h3>
                </div>

                <div className="progress-container" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {estoqueFiltrado.map((item) => {
                    const status = calcularStatus(item.nome_medicamento, item.estoque_atual);
                    if (status.status === "OK") return null;
  
                    const progresso = (item.estoque_atual / status.minQuantidade) * 100;
                    return (
                      <div key={item.id} className="progress-bar-container">
                        <div className="progress-bar-label">
                          {item.nome_medicamento} - {status.status}
                        </div>
                        <div className="progress-bar-background">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${progresso}%`, backgroundColor: status.color }}
                          />
                        </div>
                        <div className="progress-bar-text">
                          {item.estoque_atual} / {status.minQuantidade}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
  
            {unidadeSelecionada && estoqueFiltrado.length === 0 && !loading && (
              <p className="mensagem">Não há dados de estoque disponíveis para esta unidade.</p>
            )}
          </div>
        )}
         <footer className="footer">
          <p>Desenvolvido por Órbita Tecnologia</p>
        </footer>
      </div>
    </>
  );
}  
