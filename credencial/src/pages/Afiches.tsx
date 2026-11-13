import React, { useCallback, useEffect, useRef, useState } from 'react';
import { encontrarAfiche, miCredencial, progresoJuego } from '../lib/store';
import { interpretar, useLectorQR } from '../lib/lector';
import { nombreAfiche } from '../lib/afiches';
import type { Ir } from '../App';

// Cámara de la cacería (plan 010): queda abierta mientras la persona busca. Cada afiche nuevo suma sin salir;
// al completar la meta, la credencial muestra la ceremonia del timbre 3.
export const Afiches: React.FC<{ ir: Ir }> = ({ ir }) => {
  const mia = miCredencial();
  const [cuenta, setCuenta] = useState<{ n: number; meta: number } | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'ok' | 'info' | 'error' } | null>(null);
  const [codigo, setCodigo] = useState('');
  const ocupado = useRef(false);

  useEffect(() => { if (!mia) ir('#/crear'); else progresoJuego(mia).then(p => setCuenta({ n: p.afiches.length, meta: p.meta })).catch(() => { /* se ve al leer */ }); }, [mia, ir]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), 3500); return () => clearTimeout(t); }, [aviso]);

  const probar = useCallback(async (secreto: string) => {
    if (!mia || ocupado.current) return;
    ocupado.current = true;
    try {
      const r = await encontrarAfiche(mia, secreto);
      if (r.nuevo) { ir(`#/c/${mia}`, { timbre: r.sello }); return; }
      setCuenta({ n: r.pasos, meta: r.meta });
      setCodigo('');
      navigator.vibrate?.(r.repetido ? 40 : [60, 40, 60]);
      setAviso(r.repetido
        ? { texto: `Ya tenías el afiche ${nombreAfiche(r.afiche)}.`, tipo: 'info' }
        : { texto: r.pasos >= r.meta ? `¡Afiche ${nombreAfiche(r.afiche)}! Llevas ${r.pasos}.` : `¡Afiche encontrado! ${r.pasos} de ${r.meta}`, tipo: 'ok' });
    } catch (e) {
      setAviso({ texto: (e as Error).message, tipo: 'error' });
    } finally {
      ocupado.current = false;
    }
  }, [mia, ir]);

  const { video, estado } = useLectorQR(texto => {
    const l = interpretar(texto);
    if (l.tipo === 'afiche') probar(l.secreto);
    else if (l.tipo === 'sello') ir(l.ruta);
    else setAviso({ texto: 'Ese código no es de un afiche de la cacería.', tipo: 'info' });
  });

  const escrito = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    if (limpio.length < 4) { setAviso({ texto: 'Escribe el código que está bajo el sello del afiche.', tipo: 'error' }); return; }
    probar(limpio);
  };

  const mensaje = estado === 'buscando' ? 'Ponte de frente al sello del afiche' :
    estado === 'iniciando' ? 'Abriendo la cámara…' :
    estado === 'sin-camara' ? 'No pudimos abrir la cámara. Revisa el permiso del navegador o escribe el código.' :
    'No pudimos cargar el lector. Escribe el código que está bajo el sello.';

  return (
    <main className="pantalla escanear afiches">
      <div className="visor">
        {(estado === 'iniciando' || estado === 'buscando') ? (
          <>
            <video ref={video} playsInline muted autoPlay />
            <span className="mira" aria-hidden="true" />
          </>
        ) : (
          <span className="material-symbols-outlined visor-icono" aria-hidden="true">wallpaper</span>
        )}
        {cuenta && <b className="visor-cuenta">{Math.min(cuenta.n, cuenta.meta)} de {cuenta.meta}</b>}
        {aviso && <p className={`visor-aviso ${aviso.tipo}`} role="alert">{aviso.texto}</p>}
      </div>
      <p className="progreso" role="status">{mensaje}</p>
      <form className="codigo-sello" onSubmit={escrito}>
        <div className="pie-movil">
          <input value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))}
            autoComplete="off" autoCapitalize="characters" placeholder="Código del afiche" aria-label="Código del afiche" />
          <button className="btn primario">Sumar</button>
        </div>
      </form>
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir('#/juego')}>Listo</button>
      </div>
    </main>
  );
};
