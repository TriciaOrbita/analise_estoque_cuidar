import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import EstoqueTable from "./components/EstoqueTable"; 
import SaldoTable from "./components/SaldoTable"; 
import CafTable from "./components/CafTable"; 
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
            {isSidebarOpen ? "❌" : "☰"} {/* Ícone de alternância */}
          </button>
          <h1>Analise de Estoque</h1>
        </header>

        {/* Menu lateral */}
        <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <ul>
            <li>
              <Link to="/estoquetable">Analise de Estoque - Unidades</Link>
            </li>
            <li>
              <Link to="/saldotable">Saldo de Estoque Geral</Link>
            </li>
            <li>
              <Link to="/caftable">Analise de Estoque - CAF</Link>
            </li>
          </ul>
        </nav>

        {/* Conteúdo principal */}
        <div className="content">
          <Routes>
            <Route path="/saldotable" element={<SaldoTable />} />
            <Route path="/caftable" element={<CafTable />} />
            <Route
              path="/estoquetable"
              element={<EstoqueTable />}
            />
            <Route path="/" element={<div>Selecione uma unidade para ver o estoque.</div>} />
          </Routes>
        </div>
      </div>
      
      <footer className="footer">
          <p>Desenvolvido por Órbita Tecnologia</p>
        </footer>
    </Router>
  );
}
