import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <PuertaJuego app="taller-mosaicos" titulo="Taller de Mosaicos" visual="Geométrica">
      <App />
    </PuertaJuego>
  </React.StrictMode>
);
