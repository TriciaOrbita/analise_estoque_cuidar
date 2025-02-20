import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App.tsx'
import React from 'react'

// Usando a asserção de tipo para garantir que o elemento com id 'root' não é null
const rootElement = document.getElementById('root') as HTMLElement;

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
