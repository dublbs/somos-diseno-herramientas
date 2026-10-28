import React, { useCallback, useEffect, useState } from 'react';
import { Crear } from './pages/Crear';
import { Credencial } from './pages/Credencial';
import { Sello } from './pages/Sello';
import { Escanear } from './pages/Escanear';
import { miCredencial, remoto } from './lib/store';
import './styles.css';

// Rutas con hash (funcionan en cualquier carpeta o dominio, como el QR del Fotomatón):
//   #/crear · #/c/SD-XXXXX · #/sello/1..4?t=TOKEN · #/escanear
export type Ruta =
  | { vista: 'crear' }
  | { vista: 'carta'; codigo: string; aviso?: string }
  | { vista: 'sello'; sello: number; token: string }
  | { vista: 'escanear' };

export function leerRuta(hash: string): Ruta {
  const [camino, consulta = ''] = hash.replace(/^#/, '').split('?');
  const p = camino.replace(/\/+$/, '') || '/';
  let m;
  if ((m = p.match(/^\/c\/([A-Za-z0-9-]+)$/))) return { vista: 'carta', codigo: m[1].toUpperCase() };
  if ((m = p.match(/^\/sello\/(\d+)$/))) return { vista: 'sello', sello: Number(m[1]), token: new URLSearchParams(consulta).get('t') || '' };
  if (p === '/escanear') return { vista: 'escanear' };
  if (p === '/crear') return { vista: 'crear' };
  const mia = miCredencial();
  return mia ? { vista: 'carta', codigo: mia } : { vista: 'crear' };
}

export type Ir = (hash: string, extra?: { aviso?: string }) => void;

export const App: React.FC = () => {
  const [ruta, setRuta] = useState<Ruta>(() => leerRuta(window.location.hash));

  useEffect(() => {
    document.documentElement.dataset.visual = 'Pixel';
    const alCambiar = () => setRuta(leerRuta(window.location.hash));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const ir: Ir = useCallback((hash, extra = {}) => {
    history.replaceState(null, '', hash);
    const r = leerRuta(hash);
    setRuta(r.vista === 'carta' ? { ...r, ...extra } : r);
  }, []);

  return (
    <div className="movil">
      <header className="barra-movil">
        <span className="marca">Credencial</span>
        <span className="marca-sub">Somos Diseño</span>
        {!remoto && <span className="pill">Demo</span>}
      </header>
      {ruta.vista === 'crear' && <Crear ir={ir} />}
      {ruta.vista === 'carta' && <Credencial key={ruta.codigo} codigo={ruta.codigo} aviso={ruta.aviso} ir={ir} />}
      {ruta.vista === 'sello' && <Sello sello={ruta.sello} token={ruta.token} ir={ir} />}
      {ruta.vista === 'escanear' && <Escanear ir={ir} />}
    </div>
  );
};
