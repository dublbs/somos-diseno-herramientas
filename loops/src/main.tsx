import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PuertaJuego } from '../../shared/ui/Juego';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    {/* El botón del encargado va en el hueco de la barra superior, entre el título y las acciones. */}
    <PuertaJuego app="loops" titulo="Teatro de Papel" visual="Orgánica" encargadoX="calc(50% - 110px)">
      <App />
    </PuertaJuego>
  </React.StrictMode>
);
