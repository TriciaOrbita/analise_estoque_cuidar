import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import EstoqueTable from "./components/EstoqueTable"; 
import CafTable from "./components/CafTable"; 
import EntradasSaidas from "./components/EntradasSaidas";
import React, { useState } from "react";

export default function App() {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);  // Estado para controlar o menu

  // Função para alternar o estado do menu lateral
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="app-container">
        {/* Barra de navegação superior */}
        <header className="header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? "☰" : "☰"} {/* Ícone de alternância */}
          </button>
          <h1>Análise de Estoque</h1>
        </header>

        {/* Menu lateral */}
        <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <ul>
            <li> 
              <Link to="/">Página Inicial</Link>
            </li>
            <li>
              <Link to="/estoquetable">Análise de Estoque - Unidades</Link>
            </li>
            <li>
              <Link to="/caftable">Análise de Estoque - CAF</Link>
            </li>
            <li>
              <Link to="/saidas_e_entradas_CAF">Análise de Movimentações - CAF</Link>
            </li>
          </ul>
        </nav>

        {/* Conteúdo principal */}
        <div className="content">
          <Routes>
            <Route path="/caftable" element={<CafTable />} />
            <Route
              path="/estoquetable"
              element={<EstoqueTable />}
            />
             <Route
              path="/saidas_e_entradas_CAF"
              element={<EntradasSaidas />}
            />
           <Route path="/" element={
              <div className="explanation-container">
                <h2>Bem-vindo ao sistema de Análise de estoque!</h2>
                <p>Este site permite analisar a quantidade de estoque disponível de cada item de forma detalhada. Ao selecionar uma unidade, você poderá:</p>
                <ul>
                  <li><strong>Visualizar o total em estoque</strong>, com a quantidade atual de cada item.</li>
                  <li><strong>Acompanhar o status de cada item</strong>, que é determinado com base nas quantidades mínimas necessárias para garantir o abastecimento.</li>
                  <li><strong>Verificar barras de progresso</strong>, que indicam o status do estoque de cada item em tempo real, com cores representando as condições do estoque (OK, Baixo, Crítico).</li>
                </ul>
                <p>Para refinar sua busca, você pode usar filtros para mostrar apenas itens indisponíveis, com estoque baixo ou crítico. Selecione uma unidade para começar!</p>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
