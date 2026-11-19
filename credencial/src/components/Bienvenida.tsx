import React, { useEffect, useRef, useState } from 'react';
import { TIMBRES, type Tema } from '../temas';

// Bienvenida «Tu recorrido» (plan 012 §1 y §8): 3 tarjetas justo después de crear la credencial, una vez por credencial.
// Se pasa con «Siguiente», deslizando o con las flechas del teclado; «Saltar» la cierra. Se vuelve a ver desde Juego.
const LLAVE = (codigo: string) => 'sd:bienvenida:' + codigo;
export function bienvenidaVista(codigo: string): boolean { try { return localStorage.getItem(LLAVE(codigo)) === '1'; } catch { return true; } }
export function marcarBienvenida(codigo: string) { try { localStorage.setItem(LLAVE(codigo), '1'); } catch { /* sin almacenamiento */ } }

const TARJETAS = [
  { timbre: 2, titulo: 'Crea en las tablets', texto: 'Haz algo en 2 experiencias distintas. Escribe tu código en la tablet y lo que hagas llega a tu inventario.' },
  { timbre: 3, titulo: 'Caza 3 afiches', texto: 'Hay afiches repartidos por la sede. Encuéntralos y apúntales con «Buscar afiches».' },
  { timbre: 4, titulo: 'Arma tu flyer y canjea tu bolsa', texto: 'Con lo que juntaste armas tu flyer aquí mismo. Con los 4 timbres, muestra tu credencial al equipo y llévate tu bolsa.' },
];

export const Bienvenida: React.FC<{ codigo: string; tema: Tema; onCerrar: () => void }> = ({ codigo, tema, onCerrar }) => {
  const [i, setI] = useState(0);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const t = TARJETAS[i], ultima = i === TARJETAS.length - 1;
  const cerrar = () => { marcarBienvenida(codigo); onCerrar(); };
  const ir = (d: number) => setI(n => Math.min(TARJETAS.length - 1, Math.max(0, n + d)));
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
      else if (e.key === 'ArrowRight') ir(1);
      else if (e.key === 'ArrowLeft') ir(-1);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="timbrado bienvenida" role="dialog" aria-modal="true" aria-labelledby="titulo-bienvenida"
      onPointerDown={e => { inicio.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={e => {
        const s = inicio.current; inicio.current = null;
        if (!s) return;
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) ir(dx < 0 ? 1 : -1);
      }}>
      <div className="timbrado-tarjeta bienvenida-tarjeta" key={i}>
        <p className="etq">Tu recorrido · {i + 1} de {TARJETAS.length}</p>
        <div className="bienvenida-imagen">
          <span className="bienvenida-numero" aria-hidden="true">{i + 1}</span>
          <img src={TIMBRES[tema.visual][t.timbre - 1].src} alt="" />
        </div>
        <h2 id="titulo-bienvenida">{t.titulo}</h2>
        <p className="bienvenida-texto">{t.texto}</p>
        {i === 0 && <p className="bienvenida-codigo">Tu código: <b>{codigo}</b></p>}
        <p className="progreso-timbres" aria-hidden="true">
          {TARJETAS.map((_, k) => <span key={k} className={k <= i ? 'lleno' : ''} />)}
        </p>
        <div className="bienvenida-acciones">
          <button type="button" className="btn" onClick={cerrar}>{ultima ? 'Cerrar' : 'Saltar'}</button>
          <button type="button" className="btn primario" onClick={() => (ultima ? cerrar() : ir(1))} autoFocus>{ultima ? '¡Vamos!' : 'Siguiente'}</button>
        </div>
      </div>
    </div>
  );
};
