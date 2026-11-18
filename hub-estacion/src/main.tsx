import './compat-flip';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { HojaCuerpos } from './HojaCuerpos';
import { Galeria } from './galeria/Galeria';

// ?cuerpos · hoja de cuerpos · ?galeria o #/galeria · modo galería (respaldo liviano de la pantalla Flip, plan 014 §3).
const params = new URLSearchParams(window.location.search);
const esGaleria = () => params.has('galeria') || /^#\/?galeria/.test(window.location.hash);
const Vista = params.has('cuerpos') ? HojaCuerpos : esGaleria() ? Galeria : App;
// Cambiar de vista por el hash recarga la página (el HUB y la galería no conviven).
window.addEventListener('hashchange', () => { if (esGaleria() !== (Vista === Galeria)) window.location.reload(); });

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Vista />
  </React.StrictMode>
);
