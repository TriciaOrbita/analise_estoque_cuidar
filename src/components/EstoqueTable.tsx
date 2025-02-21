import { useState, useEffect } from "react";
import axios from "axios";
import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaTimesCircle } from "react-icons/fa";
import "../styles.css";

// Interface para os dados do estoque
interface EstoqueItem {
  id: number;
  nome_medicamento: string;
  saldo_estoque: number;
  lote?: string;
  data_movimentacao: string;
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

  // Função para calcular o status do medicamento
  const calcularStatus = (nomeMedicamento: string, saldoEstoque: number) => {
    const nomeMedicamentoLower = nomeMedicamento.toLowerCase();

    // Filtrar correspondências no JSON
    const correspondencias = Object.keys(quantidadesMinimas).filter((medicamento) =>
      nomeMedicamentoLower.includes(medicamento.toLowerCase())
    );

    // Define uma quantidade mínima padrão caso não seja encontrada no JSON
    const minQuantidade = correspondencias.length === 0 ? 20 : quantidadesMinimas[correspondencias[0]];

    if (saldoEstoque === 0) {
      return { status: "Indisponível", color: "red", icon: <FaTimesCircle />, minQuantidade };
    }
    if (saldoEstoque > minQuantidade) {
      return { status: "OK", color: "green", icon: <FaCheckCircle/>, minQuantidade };
    }
    
    if (saldoEstoque >= minQuantidade * 0.5) {
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

  const calcularStatus2 = (nomeMedicamento: string, saldoEstoque: number) => {
    const nomeMedicamentoLower = nomeMedicamento.toLowerCase();
  
    // Filtrar correspondências no JSON
    const correspondencias = Object.keys(quantidadesMinimas).filter((medicamento) =>
      nomeMedicamentoLower.includes(medicamento.toLowerCase())
    );
  
    // Define uma quantidade mínima padrão caso não seja encontrada no JSON
    const minQuantidade = correspondencias.length === 0 ? 20 : quantidadesMinimas[correspondencias[0]];
  
    if (saldoEstoque === 0) {
      return { status: "Indisponível", color: "black", icon: <FaTimesCircle style={{ color: "red" }} />, minQuantidade };
    }
    if (saldoEstoque > minQuantidade) {
      return { status: "OK", color: "black", icon: <FaCheckCircle style={{ color: "green" }} />, minQuantidade };
    }
    if (saldoEstoque >= minQuantidade * 0.5) {
      return { status: "Baixo", color: "black", icon: <FaExclamationTriangle style={{ color: "gold" }} />, minQuantidade };
    }
    return { status: "Crítico", color: "black", icon: <FaExclamationCircle style={{ color: "darkorange" }} />, minQuantidade };
  };
  
  // Funções para alternar os filtros
  const toggleFiltroIndisponivel = () => setFiltroIndisponivel((prev) => !prev);
  const toggleFiltroBaixo = () => setFiltroBaixo((prev) => !prev);
  const toggleFiltroCritico = () => setFiltroCritco((prev) => !prev);
  
  // Filtrar estoque de acordo com os filtros aplicados
  let estoqueFiltrado = estoque.filter((item) => {
    const { status } = calcularStatus2(item.nome_medicamento, item.saldo_estoque);
  
    if (filtroIndisponivel && status !== "Indisponível") return false;
    if (filtroBaixo && status !== "Baixo") return false;
    if (filtroCritco && status !== "Crítico") return false;
  
    return true; // Mantém o item se passar pelos filtros
  });
  
  // Aplicar filtro de pesquisa
  const estoqueFinal = estoqueFiltrado.filter((item) =>
    item.nome_medicamento.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
                </div>
              )}
  
            {/* Exibe o estoque se a unidade for selecionada e o estoque estiver disponível */}
            {unidadeSelecionada && estoqueFinal.length > 0 && (
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
                      {estoqueFinal.map((item) => {
                        const status = calcularStatus2(item.nome_medicamento, item.saldo_estoque);
                        return (
                          <tr key={item.id} style={{ backgroundColor: status.color + "30" }}>
                            <td>{item.nome_medicamento}</td>
                            <td>{item.saldo_estoque}</td>
                            <td>{item.lote || "N/A"}</td>
                            <td>{item.data_movimentacao}</td>
                            <td style={{ color: status.color }}>
                              {status.icon} {status.status}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
  
                {/* Barra de Progresso */}
                <div className="progress-container" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {estoqueFinal.map((item) => {
                    const status = calcularStatus(item.nome_medicamento, item.saldo_estoque);
                    if (status.status === "OK") return null;
  
                    const progresso = (item.saldo_estoque / status.minQuantidade) * 100;
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
                          {item.saldo_estoque} / {status.minQuantidade}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
  
            {unidadeSelecionada && estoqueFinal.length === 0 && !loading && (
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
