import React, { useCallback, useEffect, useRef, useState } from 'react';
import { encontrarAfiche, miCredencial, progresoJuego, reconocerAfiche, type ResultadoAfiche } from '../lib/store';
import { interpretar, useLectorQR } from '../lib/lector';
import { nombreAfiche } from '../lib/afiches';
import { useReconocerAfiche, type Puntaje } from '../lib/reconocer-afiche';
import type { Ir } from '../App';

// Cámara de la cacería (plan 010): queda abierta mientras la persona busca. Cada afiche nuevo suma sin salir;
// al completar la meta, la credencial muestra la ceremonia del timbre 3.
// Basta apuntar al afiche: se reconoce por su diseño (plan 013, lib/reconocer-afiche.ts). El QR del sello
// (plan 010) se sigue leyendo en silencio por si un afiche lo trae. #/afiches?ver muestra los puntajes en vivo.
export const Afiches: React.FC<{ ir: Ir }> = ({ ir }) => {
  const mia = miCredencial();
  const [cuenta, setCuenta] = useState<{ n: number; meta: number } | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'ok' | 'info' | 'error' } | null>(null);
  const ocupado = useRef(false);

  useEffect(() => { if (!mia) ir('#/crear'); else progresoJuego(mia).then(p => setCuenta({ n: p.afiches.length, meta: p.meta })).catch(() => { /* se ve al leer */ }); }, [mia, ir]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), 3500); return () => clearTimeout(t); }, [aviso]);

  // buscar: cómo se timbra (con el secreto del QR o con el id que reconoció la cámara).
  const probar = useCallback(async (buscar: (codigo: string) => Promise<ResultadoAfiche>) => {
    if (!mia || ocupado.current) return;
    ocupado.current = true;
    try {
      const r = await buscar(mia);
      if (r.nuevo) { ir(`#/c/${mia}`, { timbre: r.sello }); return; }
      setCuenta({ n: r.pasos, meta: r.meta });
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
    if (l.tipo === 'afiche') probar(c => encontrarAfiche(c, l.secreto));
    else if (l.tipo === 'sello') ir(l.ruta);
    else setAviso({ texto: 'Ese código no es de un afiche de la cacería.', tipo: 'info' });
  });

  const ver = location.hash.includes('?ver');
  const [diagnostico, setDiagnostico] = useState<Puntaje[]>([]);
  useReconocerAfiche(video, estado === 'buscando', id => probar(c => reconocerAfiche(c, id)), ver ? setDiagnostico : undefined);

  const mensaje = estado === 'buscando' ? 'Encuadra el afiche completo, de frente' :
    estado === 'iniciando' ? 'Abriendo la cámara…' :
    'No pudimos abrir la cámara. Revisa el permiso del navegador y vuelve a entrar.';

  return (
    <main className="pantalla escanear afiches">
      <div className="visor">
        {(estado === 'iniciando' || estado === 'buscando') ? (
          <>
            <video ref={video} playsInline muted autoPlay />
            <span className="mira afiche" aria-hidden="true" />
          </>
        ) : (
          <span className="material-symbols-outlined visor-icono" aria-hidden="true">wallpaper</span>
        )}
        {cuenta && <b className="visor-cuenta">{Math.min(cuenta.n, cuenta.meta)} de {cuenta.meta}</b>}
        {aviso && <p className={`visor-aviso ${aviso.tipo}`} role="alert">{aviso.texto}</p>}
      </div>
      <p className="progreso" role="status">{mensaje}</p>
      {ver && <p className="diagnostico" aria-live="off">{diagnostico.map(d => `${nombreAfiche(d.id)} ${d.puntaje.toFixed(2)}`).join(' · ') || 'Cargando…'} · pasa con 0,34 y 0,12 de ventaja</p>}
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir('#/juego')}>Listo</button>
      </div>
    </main>
  );
};
