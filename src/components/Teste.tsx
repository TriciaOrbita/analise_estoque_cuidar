import React, { useEffect, useState } from "react";

// Definição da interface para os itens de estoque
interface UnidadePedido {
  nome_unidade: string;
  quantidade_pedida: number;
}

interface EstoqueItem {
  nome_medicamento: string;
  estoque_atual: number;
  lote: string;
  data_atualizacao: string;
  unidades: UnidadePedido[];
}

const Teste = () => {
  const [dados, setDados] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/estoque/CAF"); // Substitua pela URL real da API
        const data = await response.json();
        
        // Agrupar os dados por nome do medicamento e lote
        const groupedData = data.reduce((acc: { [key: string]: EstoqueItem }, item: any) => {
          const key = `${item.nome_medicamento}-${item.lote}`;
          if (!acc[key]) {
            acc[key] = {
              nome_medicamento: item.nome_medicamento,
              estoque_atual: item.estoque_atual,
              lote: item.lote,
              data_atualizacao: item.data_atualizacao,
              unidades: [],
            };
          }
          
          // Verificar se os detalhes do pedido existem antes de adicionar
          const nomeUnidade = item.detalhes_pedidos?.nome_unidade;
          const quantidadePedida = item.detalhes_pedidos?.quantidade_pedida;

          if (nomeUnidade && quantidadePedida !== undefined) {
            acc[key].unidades.push({
              nome_unidade: nomeUnidade,
              quantidade_pedida: quantidadePedida,
            });
          }

          return acc;
        }, {});

        setDados(Object.values(groupedData));
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tabela de Estoque</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nome do Item</th>
            <th className="border p-2">Estoque Atual</th>
            <th className="border p-2">Lote</th>
            <th className="border p-2">Data de Atualização</th>
            <th className="border p-2">Unidades que Pediram</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item, index) => (
            <tr key={index} className="border">
              <td className="border p-2">{item.nome_medicamento}</td>
              <td className="border p-2">{item.estoque_atual}</td>
              <td className="border p-2">{item.lote}</td>
              <td className="border p-2">{new Date(item.data_atualizacao).toLocaleString()}</td>
              <td className="border p-2">
                {item.unidades.length > 0 ? (
                  item.unidades.map((uni, idx) => (
                    <div key={idx}>
                      {uni.nome_unidade} ({uni.quantidade_pedida})
                    </div>
                  ))
                ) : (
                  <span>Sem pedidos</span> // Caso não haja unidades pedidas, exibe essa mensagem
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
  

export default Teste;
