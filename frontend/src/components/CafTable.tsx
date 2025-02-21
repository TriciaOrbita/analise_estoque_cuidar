import { useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaTimesCircle } from "react-icons/fa";
import "../styles.css";

// Interface para os dados de estoque da CAF
interface EstoqueItem {
  id: number;
  nome_medicamento: string;
  saldo_estoque: number;
  lote?: string;
  data_movimentacao: string;
}

export default function CafTable() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [quantidadesMinimas, setQuantidadesMinimas] = useState<{ [key: string]: number }>({});
  const [filtroIndisponivel, setFiltroIndisponivel] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // Carregar estoque da unidade CAF
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get("https://apianaliseestoque-production.up.railway.app/estoque/CAF")  // Endpoint para obter os dados da CAF
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

  // Função para alternar o filtro "Indisponível"
  const toggleFiltroIndisponivel = () => {
    setFiltroIndisponivel((prev) => !prev);
  };

  // Filtrar o estoque de acordo com o filtro "Indisponível"
  const estoqueFiltrado = filtroIndisponivel
    ? estoque.filter((item) => item.saldo_estoque === 0)
    : estoque;

  return (
    <div className="estoque-caf-container-1">
      {loading && <p>Carregando dados...</p>}
      {error && <p className="mensagem erro">{error}</p>}

      {!loading && !error && estoque.length > 0 && (
        <div>
          <h2>Estoque da unidade CAF</h2>

          <div className="search-bar">
          <input
            type="text"
            placeholder="Pesquisar medicamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

          {/* Botão para ativar/desativar filtro "Indisponível" */}
          <button onClick={toggleFiltroIndisponivel}>
            {filtroIndisponivel ? "Mostrar Todos" : "Mostrar Indisponíveis"}
          </button>

          {/* Caixa rolável para a tabela */}
          <div className="estoque-caf-container">
            <table className="estoque-table">
              <thead>
                <tr>
                  <th>Nome do Medicamento</th>
                  <th>Saldo em Estoque</th>
                  <th>Lote</th>
                  <th>Data de Movimentação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {estoqueFiltrado.map((item) => {
                  const status = calcularStatus(item.nome_medicamento, item.saldo_estoque);
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
          <div className="progress-container" style={{ maxHeight: "200px", overflowY: "auto" }}>
            {estoqueFiltrado.map((item) => {
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

      {!loading && estoque.length === 0 && !error && (
        <p className="mensagem">Não há dados de estoque disponíveis para a unidade CAF.</p>
      )}
    </div>
  );
}
