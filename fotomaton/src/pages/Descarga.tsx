import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { obtenerTarjeta } from '../lib/publicar';

// Experiencias que usan esta página para su QR (plan 011). Sin `?app=` es el Fotomatón.
const EXPERIENCIAS: Record<string, { nombre: string; que: string; archivo: string }> = {
  fotomaton: { nombre: 'Fotomatón', que: 'tu tarjeta del Fotomatón CMYK', archivo: 'fotomaton' },
  graffiti: { nombre: 'Graffiti y Tags', que: 'tu muro', archivo: 'graffiti' },
  mosaicos: { nombre: 'Taller de Mosaicos', que: 'tu mosaico', archivo: 'mosaico' },
  grabado: { nombre: 'Taller de Grabado', que: 'tu grabado', archivo: 'grabado' },
  audioreactiva: { nombre: 'Estación Audioreactiva', que: 'tu loop', archivo: 'audioreactiva' },
  juego: { nombre: 'Hora punta', que: 'tu mural', archivo: 'hora-punta' },
  teatro: { nombre: 'Teatro de Papel', que: 'tu escena', archivo: 'teatro' },
};

// /f/:id — lo abre el celular al escanear el QR (del Fotomatón o de cualquier experiencia, plan 011).
export function Descarga() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const exp = EXPERIENCIAS[params.get('app') ?? 'fotomaton'] ?? EXPERIENCIAS.fotomaton;
  const video = params.get('video') === '1', archivo = `${exp.archivo}-somos-diseno.${video ? 'webm' : 'png'}`;
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'vencida'>('cargando');
  const [url, setUrl] = useState('');
  useEffect(() => {
    document.documentElement.dataset.visual = 'Geométrica';
    obtenerTarjeta(id).then(r => { if (r) { setUrl(r.url); setEstado('ok'); } else setEstado('vencida'); });
  }, [id]);

  const compartir = async () => {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], archivo, { type: blob.type || 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Somos Diseño' });
      else descargar();
    } catch { /* la persona cerró el menú */ }
  };
  const descargar = () => { const a = document.createElement('a'); a.href = url; a.download = archivo; a.click(); };

  return (
    <>
      <header className="top"><div className="marca">{exp.nombre} <span className="chip">Somos Diseño</span></div></header>
      <main className="descarga">
        {estado === 'cargando' && <p className="bajada">Buscando {exp.que}…</p>}
        {estado === 'vencida' && <>
          <h2 style={{ font: '800 32px var(--fuente-tit)', margin: 0 }}>Ya no está</h2>
          <p className="bajada" style={{ margin: 0 }}>Lo que se lleva con QR se borra a las 24 horas. Si quieres otra, pasa de nuevo por {exp.nombre}.</p>
        </>}
        {estado === 'ok' && <>
          {video ? <video src={url} controls autoPlay loop muted playsInline style={{ maxWidth: '100%' }} /> : <img src={url} alt={exp.que[0].toUpperCase() + exp.que.slice(1)} />}
          <div className="acciones" style={{ marginTop: 0 }}>
            <button className="btn primario" onClick={compartir}>Compartir</button>
            <button className="btn" onClick={descargar}>Descargar</button>
          </div>
          <p className="ayuda">Queda disponible 24 horas y después se borra.</p>
        </>}
      </main>
    </>
  );
}
