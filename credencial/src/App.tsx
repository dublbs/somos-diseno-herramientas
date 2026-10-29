import React, { useCallback, useEffect, useState } from 'react';
import { Crear } from './pages/Crear';
import { Credencial } from './pages/Credencial';
import { Sello } from './pages/Sello';
import { Escanear } from './pages/Escanear';
import { Foto } from './pages/Foto';
import { miCredencial, remoto } from './lib/store';
import { temaDe, type Tema } from './temas';
import type { Cara } from './pixel/render';
import './styles.css';

// Rutas con hash (funcionan en cualquier carpeta o dominio, como el QR del Fotomatón):
//   #/crear · #/c/SD-XXXXX · #/sello/1..4?t=CODIGO · #/escanear · #/foto
export type Ruta =
  | { vista: 'crear' }
  | { vista: 'carta'; codigo: string; aviso?: string; cara?: Cara; timbre?: number }
  | { vista: 'sello'; sello: number; token: string }
  | { vista: 'escanear' }
  | { vista: 'foto' };

export function leerRuta(hash: string): Ruta {
  const [camino, consulta = ''] = hash.replace(/^#/, '').split('?');
  const p = camino.replace(/\/+$/, '') || '/';
  let m;
  if ((m = p.match(/^\/c\/([A-Za-z0-9-]+)$/))) return { vista: 'carta', codigo: m[1].toUpperCase() };
  if ((m = p.match(/^\/sello\/(\d+)$/))) return { vista: 'sello', sello: Number(m[1]), token: new URLSearchParams(consulta).get('t') || '' };
  if (p === '/escanear') return { vista: 'escanear' };
  if (p === '/foto') return { vista: 'foto' };
  if (p === '/crear') return { vista: 'crear' };
  const mia = miCredencial();
  return mia ? { vista: 'carta', codigo: mia } : { vista: 'crear' };
}

export type Ir = (hash: string, extra?: { aviso?: string; cara?: Cara; timbre?: number }) => void;
// Cada pantalla avisa qué marco manda: la UI completa toma su tema.
export type PonerTema = (marco: string) => void;

// El tema se aplica en <html>: data-visual (forma, tipografía y sombras de shared/somos-tokens.css)
// y los colores del marco, que mandan sobre el modo oscuro del sistema.
function aplicarTema(t: Tema) {
  const r = document.documentElement;
  r.dataset.visual = t.visual;
  const v: Record<string, string> = {
    '--tema-banda': t.banda, '--tema-tinta': t.tinta,
    // URL absoluta: dentro de una variable CSS, una ruta relativa se resolvería contra la hoja de estilos.
    '--tema-patron': `url("${new URL(t.patron, document.baseURI).href}")`,
    '--tema-tam': `${t.tamPatron ?? 96}px`, '--tema-velo': `${Math.round((t.velo ?? 0.62) * 100)}%`,
    '--accent': t.acento, '--on-accent': t.sobreAcento,
    '--bg': '#F4EEE3', '--surface': '#F4EEE3', '--ink': '#000000', '--muted': '#4A453E', '--line': 'rgba(0,0,0,.18)', '--chip': '#E5DCCB',
  };
  for (const [k, val] of Object.entries(v)) r.style.setProperty(k, val);
  r.style.colorScheme = 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.banda);
}

export const App: React.FC = () => {
  const [ruta, setRuta] = useState<Ruta>(() => leerRuta(window.location.hash));
  const [tema, setTema] = useState<Tema>(() => temaDe(undefined));
  const ponerTema: PonerTema = useCallback(marco => setTema(temaDe(marco)), []);

  useEffect(() => { aplicarTema(tema); }, [tema]);
  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta(window.location.hash));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const ir: Ir = useCallback((hash, extra = {}) => {
    // Dentro de claude.ai (iframe) la ruta vive solo en el estado: el visor no acepta #/rutas.
    if (window.top === window) { try { history.replaceState(null, '', hash); } catch { /* sin historial */ } }
    const r = leerRuta(hash);
    setRuta(r.vista === 'carta' ? { ...r, ...extra } : r);
  }, []);

  return (
    <div className="movil">
      <header className="barra-movil">
        <a className="volver-hub" href="../../" aria-label="Volver a las experiencias">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        </a>
        <span className="marca">Credencial</span>
        <span className="marca-sub"><span className="solo-ancho">Somos Diseño · </span>{tema.visual}</span>
        {!remoto && <span className="pill">Demo</span>}
      </header>
      {ruta.vista === 'crear' && <Crear ir={ir} ponerTema={ponerTema} />}
      {ruta.vista === 'carta' && <Credencial key={ruta.codigo + (ruta.cara || '') + (ruta.timbre || '')} codigo={ruta.codigo} aviso={ruta.aviso} cara={ruta.cara} timbre={ruta.timbre} ir={ir} ponerTema={ponerTema} tema={tema} />}
      {ruta.vista === 'sello' && <Sello sello={ruta.sello} token={ruta.token} ir={ir} />}
      {ruta.vista === 'escanear' && <Escanear ir={ir} />}
      {ruta.vista === 'foto' && <Foto ir={ir} ponerTema={ponerTema} />}
    </div>
  );
};
