import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import '../saldo.css'

interface SaldoItem {
  unidade: string;
  total_saldo_estoque: number;
}

export default function SaldoTable() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<SaldoItem[]>([]);

  // Carregar os dados de saldo total
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get("http://localhost:8000/saldo_total") // Endpoint para obter os dados de saldo total
      .then((response) => {
        console.log("Resposta da API:", response.data); // Verifique a resposta no console
        if (Array.isArray(response.data)) {
          setSaldo(response.data);
        } else {
          setError("Formato de dados inválido.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Erro ao carregar dados de saldo total");
        setLoading(false);
        console.error(err);
      });
  }, []);

  return (
    <div className="saldo-container">
      {loading && <p className="mensagem">Carregando dados...</p>}
      {error && <p className="mensagem erro">{error}</p>}

      {!loading && !error && saldo.length > 0 && (
        <div>
          <h2>Saldo Total por Unidade</h2>
          <div className="tabela-container">
            <table className="saldo-table">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Total de Saldo de Estoque</th>
                </tr>
              </thead>
              <tbody>
                {saldo.map((item) => (
                  <tr key={item.unidade}>
                    <td>{item.unidade}</td>
                    <td>{item.total_saldo_estoque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && saldo.length === 0 && !error && (
        <p className="mensagem">Não há dados de saldo disponíveis.</p>
      )}
    </div>
  );
}
