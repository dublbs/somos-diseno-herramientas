import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { otorgarCreacion } from '../../shared/juego';
import { MARCOS, porId, type Visual } from './data/marcos';
import { TINTAS } from './data/tintas';
import { Carrete, Lateral } from './components/Barras';
import { BotonAccion } from '../../shared/ui/Kit';
import { Quiosco } from '../../shared/ui/Tutorial';
import '../../shared/ui/somos-kit.css';
import { Camara } from './components/Camara';
import { Editor, type FotoEditable } from './components/Editor';
import { PasoQR } from './components/PasoQR';
import { Portada } from './components/Portada';
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
    try { setTarjeta(await hacerTarjeta()); setPaso('qr'); otorgarCreacion('fotomaton'); }
    catch { setAviso('No pudimos preparar la tarjeta.'); } finally { setOcupado(false); }
  };

  // Terminar: vuelve a la portada y limpia todo lo de la persona anterior.
  const terminar = () => {
    setFoto(null); setTarjeta(null); setRevelando(false);
    setCelda(2.5); setTinta('cmyk'); setPaso('inicio');
  };

  const destino = porId(marcoId), textoCambio = destino.visual + ' · ' + destino.name;
  const lateral = <Lateral visual={visual} celda={celda} setCelda={setCelda} tinta={tinta} setTinta={setTinta} foto={paso === 'editar' && !revelando ? foto : null} />;
  const carrete = <Carrete visual={visual} elegirVisual={elegirVisual} marcoId={marcoId} setMarcoId={setMarcoId} miniaturas={miniaturas} />;
  const inicio = <BotonAccion icono="restart_alt" texto="Inicio" onClick={terminar} />;
  const input = <input ref={archivo} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={alArchivo} />;
  const avisoEl = <>{aviso ? <div className="aviso" role="status">{aviso}</div> : null}<Quiosco app="fotomaton" activo={paso !== 'inicio'} alReiniciar={terminar} /></>;

  // Cámara y edición son la herramienta (barras fijas del kit); portada y QR son pantallas de paso.
  if (paso === 'camara' || paso === 'editar') return (
    <>
      {input}
      {paso === 'camara' ? (
        <Camara marco={marcoMostrado} celda={celda} tinta={tinta} cambiando={cambiando} textoCambio={textoCambio} alSubir={subir}
          volver={HUB_URL} acciones={inicio} lateral={lateral} carrete={carrete}
          alFoto={(f, c) => { revelar(); setFoto({ c: f, cara: c }); setPaso('editar'); }} />
      ) : (
        <Editor foto={foto} marco={marcoMostrado} celda={celda} tinta={tinta} revelando={revelando} cambiando={cambiando}
          textoCambio={textoCambio} ocupado={ocupado} alGuardar={guardar} alLlevatela={llevatela} alOtra={() => setPaso('camara')}
          volver={HUB_URL} acciones={inicio} lateral={lateral} carrete={carrete} />
      )}
      {avisoEl}
    </>
  );

  return (
    <div className="app-pantalla">
      {input}
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href={HUB_URL} aria-label="Volver a las experiencias">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            Experiencias
          </a>
          <div className="barra-info">
            <h1>Fotomatón</h1>
            <p className="bajada-corta">Tu foto con el efecto y el marco de cada lenguaje</p>
          </div>
        </div>
        {paso !== 'inicio' ? <button className="btn btn-inicio" onClick={terminar}>Inicio</button> : null}
      </header>
      {paso === 'inicio' && <Portada alCamara={() => setPaso('camara')} alSubir={subir} />}
      {paso === 'qr' && tarjeta && (
        <main className="cuerpo-pantalla cuerpo-qr">
          <PasoQR blob={tarjeta} marco={marcoMostrado} tinta={tinta} alTerminar={terminar} alVolver={() => setPaso('editar')} />
        </main>
      )}
      {avisoEl}
    </div>
  );
}
