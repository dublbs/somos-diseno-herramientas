import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { HojaCuerpos } from './HojaCuerpos';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    {new URLSearchParams(window.location.search).has('cuerpos') ? <HojaCuerpos /> : <App />}
  </React.StrictMode>
);
