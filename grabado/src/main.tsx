import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <PuertaJuego app="grabado" titulo="Taller de Grabado" visual="Orgánica">
      <App />
    </PuertaJuego>
  </React.StrictMode>
);
