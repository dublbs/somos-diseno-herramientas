import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <PuertaJuego app="audioreactiva" titulo="Estación Audioreactiva" visual="Geométrica">
      <App />
    </PuertaJuego>
  </React.StrictMode>
);
