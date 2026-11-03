import { useEffect, useState } from 'react';
import { MARCOS } from '../data/marcos';
import { TINTAS } from '../data/tintas';
import { componer } from '../lib/trama';
import { demoDe, useDemosListas } from '../lib/demo';
import { Lienzo } from './Lienzo';

export function Portada({ alCamara, alSubir }: { alCamara: () => void; alSubir: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n + 1) % MARCOS.length), 1800); return () => clearInterval(t); }, []);
  const m = MARCOS[i], demosListas = useDemosListas();
  return (
    <main className="cuerpo-pantalla portada">
    <section className="hero-texto">
      <div className="hero-contenido">
        <h2 className="titulo-portada">Foto&shy;matón</h2>
        <p className="bajada">Te sacas una foto, la pasamos por el efecto de cada lenguaje (trama CMYK, pantalla CRT o mosaico) y la enmarcas con las formas de Geométrica, Orgánica o Pixel.</p>
        <div className="pasos"><span className="chip">1 · Foto</span><span className="chip">2 · Efecto</span><span className="chip">3 · Marco</span><span className="chip">4 · Te la llevas</span></div>
        <div className="acciones">
          <button className="btn primario" onClick={alCamara}>Abrir la cámara</button>
          <button className="btn" onClick={alSubir}>Subir una foto</button>
        </div>
      </div>
    </section>
    <section className="escenario-fit" aria-hidden="true">
      <Lienzo className="lienzo-fit" deps={[i, demosListas]} dibujar={(ctx, s) => componer(ctx, s, m.id, demoDe(m.visual), 2.5, TINTAS.cmyk)} />
    </section>
    </main>
  );
}
