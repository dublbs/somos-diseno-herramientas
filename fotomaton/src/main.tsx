import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';
import { Descarga } from './pages/Descarga';
import './styles.css';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/f/:id" element={<Descarga />} />
        <Route path="*" element={<PuertaJuego app="fotomaton" titulo="Fotomatón" visual="Pixel"><App /></PuertaJuego>} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
