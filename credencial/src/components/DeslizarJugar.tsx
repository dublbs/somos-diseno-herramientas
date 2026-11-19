import React, { useRef, useState } from 'react';

// B-017: en vez del botón «Jugar», una pista para deslizar a la derecha, como «deslizar para desbloquear».
// La ficha se arrastra con el dedo; al pasar la mitad (o al soltar con impulso) entra a la vista Juego.
// Para accesibilidad también funciona tocándola o con Enter/Espacio (es un botón). El gesto en cualquier parte de la
// credencial (lib/deslizar.ts) sigue funcionando igual.
const UMBRAL = 0.5;

export const DeslizarJugar: React.FC<{ onJugar: () => void; texto?: string }> = ({ onJugar, texto = 'Desliza para jugar' }) => {
  const pista = useRef<HTMLButtonElement>(null);
  const arrastre = useRef<{ x0: number; max: number; id: number; movio: boolean } | null>(null);
  const [dx, setDx] = useState(0);
  const [soltando, setSoltando] = useState(false);
  const yaFue = useRef(false);
  const ir = () => { if (yaFue.current) return; yaFue.current = true; onJugar(); };

  const abajo = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = pista.current;
    if (!el || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const ficha = el.querySelector('.deslizar-ficha') as HTMLElement | null;
    const max = el.clientWidth - (ficha?.offsetWidth ?? 52) - 8;
    arrastre.current = { x0: e.clientX, max, id: e.pointerId, movio: false };
    setSoltando(false);
    try { el.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
  };
  const mover = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    const d = Math.max(0, Math.min(a.max, e.clientX - a.x0));
    if (d > 6) a.movio = true;
    setDx(d);
  };
  const arriba = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a || a.id !== e.pointerId) return;
    const d = Math.max(0, Math.min(a.max, e.clientX - a.x0));
    if (a.movio && d >= a.max * UMBRAL) { setDx(a.max); ir(); return; }
    setSoltando(true); setDx(0);
    if (a.movio) pista.current?.setAttribute('data-arrastro', '1'); // el click que sigue no cuenta como toque
  };
  const clic = () => {
    if (pista.current?.getAttribute('data-arrastro')) { pista.current.removeAttribute('data-arrastro'); return; }
    ir();
  };
  const avance = arrastre.current?.max ? dx / arrastre.current.max : 0;

  return (
    <button ref={pista} type="button" className={'deslizar-jugar' + (dx > 0 ? ' arrastrando' : '') + (soltando ? ' soltando' : '')}
      onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={() => { arrastre.current = null; setSoltando(true); setDx(0); }}
      onClick={clic} aria-label="Jugar: desliza a la derecha o toca aquí" style={{ '--avance': avance } as React.CSSProperties}>
      <span className="deslizar-ficha" style={{ transform: `translateX(${dx}px)` }} aria-hidden="true">
        <span className="material-symbols-outlined">play_arrow</span>
      </span>
      <span className="deslizar-texto" aria-hidden="true">{texto}</span>
      <span className="deslizar-flechas" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
};
