import React, { useEffect, useRef, useState } from 'react';

// Pantalla previa con tutorial (plan 004 §1) y modo quiosco, comunes a todas las experiencias de tablet.
// La forma la pone shared/ui/somos-kit.css según el data-visual de la experiencia.

const Icono: React.FC<{ nombre: string }> = ({ nombre }) => <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>;

export interface PasoTutorial { icono: string; texto: React.ReactNode }
export interface AccionTutorial { texto: string; icono: string; alTocar: () => void }

// Nombre, 3 pasos ilustrados (ícono + una frase) y el botón para empezar.
export const Tutorial: React.FC<{ etiqueta: string; titulo: string; pasos: PasoTutorial[]; acciones: AccionTutorial[]; volver?: string; aviso?: React.ReactNode }> =
  ({ etiqueta, titulo, pasos, acciones, volver = '../../', aviso }) => (
    <div className="k-tutorial">
      <a className="volver" href={volver}><Icono nombre="arrow_back" />Experiencias</a>
      <main className="k-tutorial-cuerpo">
        <p className="k-tutorial-etq">{etiqueta}</p>
        <h1 className="k-tutorial-titulo">{titulo}</h1>
        <ol className="k-tutorial-pasos">
          {pasos.map((p, i) => (
            <li key={i}><span className="k-tutorial-num" aria-hidden="true"><Icono nombre={p.icono} /><b>{i + 1}</b></span><span>{p.texto}</span></li>
          ))}
        </ol>
        <div className="k-tutorial-acciones">
          {acciones.map((a, i) => (
            <button key={a.texto} type="button" className={'k-btn' + (i === 0 ? ' k-primario' : '')} onClick={a.alTocar}><Icono nombre={a.icono} />{a.texto}</button>
          ))}
        </div>
        {aviso}
      </main>
    </div>
  );

// El tutorial se ve una vez por sesión: si la persona vuelve del hub, entra directo. El quiosco lo vuelve a mostrar.
const llave = (app: string) => `sd:tutorial:${app}`;
export function useTutorialVisto(app: string): [boolean, () => void] {
  const [visto, setVisto] = useState(() => { try { return sessionStorage.getItem(llave(app)) === '1'; } catch { return false; } });
  const marcar = () => { try { sessionStorage.setItem(llave(app), '1'); } catch { /* sin almacenamiento */ } setVisto(true); };
  return [visto, marcar];
}

// Modo quiosco: a los 90 s sin uso avisa («¿Sigues ahí?», 10 s antes) y luego deja la experiencia lista para la
// próxima persona: borra lo guardado en este equipo (`limpiar`) y la sesión (tutorial visto, persona del modo juego) y recarga.
// Para probarlo rápido: ?quiosco=<segundos> en la URL.
export const Quiosco: React.FC<{ app: string; activo?: boolean; limpiar?: string[]; alReiniciar?: () => void }> = ({ app, activo = true, limpiar = [], alReiniciar }) => {
  const total = (() => { const s = Number(new URLSearchParams(location.search).get('quiosco')); return (s > 0 ? s : 90) * 1000; })();
  const aviso = Math.min(10000, total / 3);
  const [quedan, setQuedan] = useState<number | null>(null);
  const ultimo = useRef(performance.now());

  useEffect(() => {
    if (!activo) { setQuedan(null); return; }
    ultimo.current = performance.now();
    const tocar = () => { ultimo.current = performance.now(); setQuedan(null); };
    const eventos = ['pointerdown', 'keydown', 'wheel'] as const;
    eventos.forEach(e => window.addEventListener(e, tocar, { passive: true }));
    const reloj = window.setInterval(() => {
      const resta = total - (performance.now() - ultimo.current);
      if (resta <= 0) {
        window.clearInterval(reloj);
        try { limpiar.forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
        if (alReiniciar) alReiniciar(); else location.reload();
      } else setQuedan(resta <= aviso ? Math.ceil(resta / 1000) : null);
    }, 250);
    return () => { eventos.forEach(e => window.removeEventListener(e, tocar)); window.clearInterval(reloj); };
  }, [activo, app, total]);

  if (quedan === null) return null;
  return (
    <div className="k-quiosco" role="alertdialog" aria-modal="true" aria-labelledby="k-quiosco-t" aria-describedby="k-quiosco-d">
      <div className="k-panel k-quiosco-caja">
        <p className="k-quiosco-cuenta" aria-hidden="true">{quedan}</p>
        <h2 id="k-quiosco-t">¿Sigues ahí?</h2>
        <p id="k-quiosco-d">En {quedan} s la experiencia vuelve al inicio y se borra lo que hiciste, para la próxima persona.</p>
        <button type="button" className="k-btn k-primario" autoFocus><Icono nombre="check" />Sigo aquí</button>
      </div>
    </div>
  );
};
