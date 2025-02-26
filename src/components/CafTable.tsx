import { useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaTimesCircle } from "react-icons/fa";
import "../styles.css";
import * as XLSX from 'xlsx';

// Interface para os dados de estoque da CAF
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

export default function CafTable() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [quantidadesMinimas, setQuantidadesMinimas] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filtroIndisponivel, setFiltroIndisponivel] = useState<boolean>(false);
  const [filtroBaixo, setFiltroBaixo] = useState<boolean>(false);
  const [filtroCritco, setFiltroCritco] = useState<boolean>(false);

  // Carregar o JSON de quantidades mínimas
  useEffect(() => {
    axios
      .get("/quantidades_minimas.json")
      .then((response) => {
        setQuantidadesMinimas(response.data);
      })
      .catch((err) => {
        setError("Erro ao carregar o arquivo de quantidades mínimas.");
        console.error(err);
      });
  }, []);

  // Carregar estoque da unidade CAF (ajustado para usar a query do servidor)
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get("https://apianaliseestoque-production.up.railway.app/estoque/CAF")  // Ajuste o endpoint conforme sua API
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setEstoque(response.data);
        } else {
          setError("Formato de dados inválido.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar dados de estoque da CAF");
        setLoading(false);
      });
  }, []);

  const calcularStatus = (nomeMedicamento: string, estoqueAtual: number) => {
      const nomeMedicamentoLower = nomeMedicamento.toLowerCase();
  
      // Filtrar correspondências no JSON
      const correspondencias = Object.keys(quantidadesMinimas).filter((medicamento) =>
        nomeMedicamentoLower.includes(medicamento.toLowerCase())
      );
  
      // Define uma quantidade mínima padrão caso não seja encontrada no JSON
      const minQuantidade = correspondencias.length === 0 ? 50 : quantidadesMinimas[correspondencias[0]];

      const estoqueAtualNumerico = Math.max(0, Number(estoqueAtual));
  
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
        color: "darkorange", 
        icon: <FaExclamationCircle style={{ color: "darkorange" }} />,  // Ícone laranja
        style: { color: "black", fontWeight: "bold" },  // Texto preto
        minQuantidade 
      };
    };

  const calcularStatus2 = (nomeMedicamento: string, estoqueAtual: number) => {
    const nomeMedicamentoLower = nomeMedicamento.toLowerCase();

    let correspondencias = Object.keys(quantidadesMinimas).filter(
      (medicamento) => nomeMedicamentoLower === medicamento.toLowerCase()
    );
  
    // Se não encontrar uma correspondência exata, tenta por correspondências parciais
    if (correspondencias.length === 0) {
      correspondencias = Object.keys(quantidadesMinimas).filter((medicamento) =>
        nomeMedicamentoLower.includes(medicamento.toLowerCase())
      );
    }
  
    // Se não encontrar nenhuma correspondência, usa um valor padrão
    const minQuantidade = correspondencias.length === 0 ? 50 : quantidadesMinimas[correspondencias[0]];


    const estoqueAtualNumerico = Math.max(0, Number(estoqueAtual));

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

let estoqueFiltrado = estoque.map((item) => {
  // Tratar estoque negativo como 0
  item.estoque_atual = Math.max(item.estoque_atual, 0);
  return item;
}).filter((item) => {
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
        "Quantidade Total": Math.max(0, item.estoque_atual), // Garantir que valores negativos sejam zero
        "Lote": item.lote || "N/A",
        "Data de Movimentação": item.data_atualizacao,
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
    <div className="estoque-caf-container-1">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando unidades...</p>
        </div>
      ) : (
        <>
          {!error && estoque.length > 0 && (
            <div>
              <h2>Estoque da unidade CAF</h2>
  
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Pesquisar item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de pesquisa
                />
              </div>
  
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
  
              <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <h3>Tabela de Saldo em Estoque</h3>
                </div>

              {/* Caixa rolável para a tabela */}
              <div className="estoque-caf-container">
                <table className="estoque-table">
                  <thead>
                    <tr>
                      <th>Nome do item</th>
                      <th>Quantidade</th>
                      <th>Quantidade Saida</th>
                      <th>Quantidade Total</th>
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
                          <tr key={item.id} style={{ backgroundColor: status.color + "30" }}>
                            <td>{item.nome_medicamento}</td>
                            <td>{item.quantidade}</td>
                            <td>{item.quantidade_saida}</td>
                            <td>{item.estoque_atual}</td>
                            <td>{item.lote || "N/A"}</td>
                            <td>{item.data_atualizacao}</td>
                            <td style={{ color: status.color }}>
                              {status.icon} {status.status}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
  
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
  
          {!loading && estoque.length === 0 && !error && (
            <p className="mensagem">Não há dados de estoque disponíveis para a unidade CAF.</p>
          )}
        </>
      )}
  
      <footer className="footer">
        <p>Desenvolvido por Órbita Tecnologia</p>
      </footer>
    </div>
  );  
  }    