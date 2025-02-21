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
      return { status: "OK", color: "green", icon: <FaCheckCircle />, minQuantidade };
    }
    if (saldoEstoque >= minQuantidade * 0.5) {
      return { status: "Baixo", color: "yellow", icon: <FaExclamationTriangle />, minQuantidade };
    }
    return { status: "Crítico", color: "orange", icon: <FaExclamationCircle />, minQuantidade };
  };

  // Função para filtrar os itens do estoque com base no termo de pesquisa
  const filteredEstoque = estoque.filter((item) =>
    item.nome_medicamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

   // Função para alternar o filtro "Indisponível"
   const toggleFiltroIndisponivel = () => {
    setFiltroIndisponivel((prev) => !prev);
  };

  // Filtrar o estoque de acordo com o filtro "Indisponível"
  const estoqueFiltrado = filtroIndisponivel
    ? estoque.filter((item) => item.saldo_estoque === 0)
    : estoque;

    const estoqueFinal = estoqueFiltrado.filter((item) =>
      item.nome_medicamento.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="estoque-container">
      {loading && <p>Carregando unidades...</p>}
      {error && <p className="mensagem erro">{error}</p>}

      {!loading && !error && unidades.length > 0 && (
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

      {/* Barra de pesquisa */}
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

          <button onClick={toggleFiltroIndisponivel}>
            {filtroIndisponivel ? "Mostrar Todos" : "Mostrar Indisponíveis"}
          </button>

      {unidadeSelecionada && estoqueFinal.length > 0 && (
        <div>
          <h2>Estoque de {unidadeSelecionada}</h2>

          {/* Caixa rolável para a tabela */}
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
                  const status = calcularStatus(item.nome_medicamento, item.saldo_estoque);
                  const progresso = (item.saldo_estoque / status.minQuantidade) * 100;
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

          {/* Caixa rolável para as barras de progresso (excluindo "OK") */}
          <div className="progress-container" style={{ maxHeight: "250px", overflowY: "auto" }}>
            {estoqueFinal.map((item) => {
              const status = calcularStatus(item.nome_medicamento, item.saldo_estoque);
              
              // Mostrar barra de progresso apenas para status diferentes de "OK"
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
  );
}
