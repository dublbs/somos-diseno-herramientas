import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerTarjeta } from '../lib/publicar';

// /f/:id — lo abre el celular al escanear el QR.
export function Descarga() {
  const { id = '' } = useParams();
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'vencida'>('cargando');
  const [url, setUrl] = useState('');
  useEffect(() => {
    document.documentElement.dataset.visual = 'Geométrica';
    obtenerTarjeta(id).then(r => { if (r) { setUrl(r.url); setEstado('ok'); } else setEstado('vencida'); });
  }, [id]);

  const compartir = async () => {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], 'fotomaton-somos-diseno.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Somos Diseño' });
      else descargar();
    } catch { /* la persona cerró el menú */ }
  };
  const descargar = () => { const a = document.createElement('a'); a.href = url; a.download = 'fotomaton-somos-diseno.png'; a.click(); };

  return (
    <>
      <header className="top"><div className="marca">Fotomatón <span className="chip">Somos Diseño</span></div></header>
      <main className="descarga">
        {estado === 'cargando' && <p className="bajada">Buscando tu tarjeta…</p>}
        {estado === 'vencida' && <>
          <h2 style={{ font: '800 32px var(--fuente-tit)', margin: 0 }}>Esta tarjeta ya no está</h2>
          <p className="bajada" style={{ margin: 0 }}>Las tarjetas se borran a las 24 horas. Si quieres otra, pasa de nuevo por el fotomatón.</p>
        </>}
        {estado === 'ok' && <>
          <img src={url} alt="Tu tarjeta del Fotomatón CMYK" />
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
