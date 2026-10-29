import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <PuertaJuego app="loops" titulo="Teatro de Papel" visual="Orgánica">
      <App />
    </PuertaJuego>
  </React.StrictMode>
);
