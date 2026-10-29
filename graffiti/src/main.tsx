import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <PuertaJuego app="graffiti" titulo="Graffiti y Tags" visual="Pixel">
      <App />
    </PuertaJuego>
  </React.StrictMode>
);
