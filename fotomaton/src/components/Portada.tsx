import { useEffect, useState } from 'react';
import { MARCOS } from '../data/marcos';
import { TINTAS } from '../data/tintas';
import { DEMO, componer } from '../lib/trama';
import { Lienzo } from './Lienzo';

export function Portada({ alCamara, alSubir }: { alCamara: () => void; alSubir: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n + 1) % MARCOS.length), 1800); return () => clearInterval(t); }, []);
  const m = MARCOS[i];
  return (
    <section className="hero">
      <div>
        <span className="chip">Mesa 3 · Imagen e identidad</span>
        <h1>Foto&shy;matón</h1>
        <p className="bajada">Te sacas una foto, la pasamos a trama CMYK y la enmarcas con las formas de Geométrica, Orgánica o Pixel.</p>
        <div className="pasos"><span className="chip">1 · Foto</span><span className="chip">2 · Trama</span><span className="chip">3 · Marco</span><span className="chip">4 · Te la llevas</span></div>
        <div className="acciones">
          <button className="btn primario" onClick={alCamara}>Abrir la cámara</button>
          <button className="btn" onClick={alSubir}>Subir una foto</button>
        </div>
      </div>
      <Lienzo deps={[i]} dibujar={(ctx, s) => componer(ctx, s, m.id, DEMO, 2.5, TINTAS.cmyk)} />
    </section>
  );
}
