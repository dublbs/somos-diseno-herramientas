import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { MARCOS, porId, type Visual } from './data/marcos';
import { TINTAS } from './data/tintas';
import { Ajustes } from './components/Ajustes';
import { Camara } from './components/Camara';
import { Editor, type FotoEditable } from './components/Editor';
import { PasoQR } from './components/PasoQR';
import { Portada } from './components/Portada';
import { Selector } from './components/Selector';
import { useRetardo } from './hooks/useRetardo';
import { cargarCara, detectarCara } from './lib/cara';
import { exportarTarjeta, nombreArchivo } from './lib/tarjeta';
import { componer, leerArchivo } from './lib/trama';
import { demoDe, useDemosListas } from './lib/demo';

const REVELADO_MIN = 1800, RETARDO_MARCO = 1500;
type Paso = 'inicio' | 'camara' | 'editar' | 'qr';
// Hub de experiencias: por defecto dos carpetas arriba (fotomaton/dist/ → Experiencias/).
const HUB_URL = (import.meta.env.VITE_HUB_URL as string | undefined) ?? '../../';

export function App() {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [visual, setVisual] = useState<Visual>('Pixel'), [marcoId, setMarcoId] = useState('PM05');
  const [celda, setCelda] = useState(2.5), [tinta, setTinta] = useState('cmyk');
  const [foto, setFoto] = useState<FotoEditable | null>(null), [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false), [tarjeta, setTarjeta] = useState<Blob | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const [marcoMostrado, cambiando] = useRetardo(marcoId, RETARDO_MARCO);
  const [revelando, setRevelando] = useState(false), inicioRevelado = useRef(0);
  const revelar = () => { inicioRevelado.current = performance.now(); setRevelando(true); };

  useEffect(() => { document.documentElement.dataset.visual = visual; }, [visual]);
  const demosListas = useDemosListas();
  const miniaturas = useMemo(() => {
    const o: Record<string, string> = {}, c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d')!;
    MARCOS.forEach(m => { componer(x, 160, m.id, demoDe(m.visual), 4, TINTAS[tinta]); o[m.id] = c.toDataURL('image/png'); });
    return o;
  }, [tinta, demosListas]);
  useEffect(() => { cargarCara(); }, []);

  // Afinar la cara sobre la foto final (más resolución que la vista previa).
  useEffect(() => {
    if (!foto || foto.afinada) return;
    let vivo = true;
    cargarCara().then(() => detectarCara(foto.c, 512)).then(r => {
      if (!vivo) return;
      setFoto(f => (f === foto ? { ...f, cara: r || f.cara, afinada: true } : f));
      const falta = Math.max(0, REVELADO_MIN - (performance.now() - inicioRevelado.current));
      setTimeout(() => setRevelando(false), falta);
    });
    return () => { vivo = false; };
  }, [foto]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 2600); return () => clearTimeout(t); }, [aviso]);

  const elegirVisual = (v: Visual) => {
    setVisual(v);
    if (porId(marcoId).visual !== v) setMarcoId(MARCOS.find(x => x.visual === v)!.id);
  };
  const subir = () => archivo.current?.click();
  const alArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    revelar(); setFoto(null); setPaso('editar');
    try { setFoto({ c: await leerArchivo(f), cara: null }); }
    catch { setRevelando(false); setPaso('inicio'); setAviso('No pudimos abrir esa imagen.'); }
  };

  const hacerTarjeta = () => exportarTarjeta(marcoMostrado, foto!.c, celda, TINTAS[tinta], foto!.cara);

  const guardar = async () => {
    setOcupado(true);
    try {
      const blob = await hacerTarjeta(), nombre = nombreArchivo(marcoMostrado);
      const file = new File([blob], nombre, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Somos Diseño' });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    } catch { /* la persona cerró el menú de compartir */ } finally { setOcupado(false); }
  };

  const llevatela = async () => {
    setOcupado(true);
    try { setTarjeta(await hacerTarjeta()); setPaso('qr'); }
    catch { setAviso('No pudimos preparar la tarjeta.'); } finally { setOcupado(false); }
  };

  // Terminar: vuelve a la portada y limpia todo lo de la persona anterior.
  const terminar = () => {
    setFoto(null); setTarjeta(null); setRevelando(false);
    setCelda(2.5); setTinta('cmyk'); setPaso('inicio');
  };

  const destino = porId(marcoId), textoCambio = destino.visual + ' · ' + destino.name;
  const panel = (
    <aside className="panel">
      <Selector visual={visual} elegirVisual={elegirVisual} marcoId={marcoId} setMarcoId={setMarcoId} miniaturas={miniaturas} />
      <Ajustes visual={visual} celda={celda} setCelda={setCelda} tinta={tinta} setTinta={setTinta} />
    </aside>
  );

  return (
    <div>
      <input ref={archivo} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={alArchivo} />
      <header className="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <a className="volver" href={HUB_URL} aria-label="Volver a las experiencias"><span aria-hidden="true">←</span> Experiencias</a>
          <div className="marca">Fotomatón <span className="chip">Somos Diseño</span></div>
        </div>
        {paso !== 'inicio' ? <button className="btn" style={{ minHeight: 44, padding: '0 18px', fontSize: 15 }} onClick={terminar}>Inicio</button> : null}
      </header>
      {paso === 'inicio' && <Portada alCamara={() => setPaso('camara')} alSubir={subir} />}
      {paso === 'camara' && (
        <main className="layout">
          <Camara marco={marcoMostrado} celda={celda} tinta={tinta} cambiando={cambiando} textoCambio={textoCambio} alSubir={subir}
            alFoto={(f, c) => { revelar(); setFoto({ c: f, cara: c }); setPaso('editar'); }} />
          {panel}
        </main>
      )}
      {paso === 'editar' && (
        <main className="layout">
          <Editor foto={foto} marco={marcoMostrado} celda={celda} tinta={tinta} revelando={revelando} cambiando={cambiando}
            textoCambio={textoCambio} ocupado={ocupado} alGuardar={guardar} alLlevatela={llevatela} alOtra={() => setPaso('camara')} />
          {panel}
        </main>
      )}
      {paso === 'qr' && tarjeta && (
        <main className="layout" style={{ display: 'block' }}>
          <PasoQR blob={tarjeta} marco={marcoMostrado} tinta={tinta} alTerminar={terminar} alVolver={() => setPaso('editar')} />
        </main>
      )}
      {aviso ? <div className="aviso" role="status">{aviso}</div> : null}
    </div>
  );
}
