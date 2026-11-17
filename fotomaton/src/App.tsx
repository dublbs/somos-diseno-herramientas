import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { jugador, otorgarCreacion } from '../../shared/juego';
import { miniatura, publicar } from '../../shared/datos';
import { MARCOS, porId, type Visual } from './data/marcos';
import { TINTAS } from './data/tintas';
import { Panel } from './components/Panel';
import { BotonAccion, Confirmar } from '../../shared/ui/Kit';
import type { Lado } from './hooks/useCamara';
import type { Cara } from './lib/cara';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import '../../shared/ui/somos-kit.css';
import { Camara } from './components/Camara';
import { Editor, type FotoEditable } from './components/Editor';
import { PasoQR } from './components/PasoQR';
import { useRetardo } from './hooks/useRetardo';
import { cargarCara, detectarCara } from './lib/cara';
import { exportarTarjeta } from './lib/tarjeta';
import { componer, leerArchivo, tienePlacas } from './lib/trama';
import { demoDe, useDemosListas } from './lib/demo';

const REVELADO_MIN = 1800, RETARDO_MARCO = 1500;
const INICIAL = { visual: 'Pixel' as Visual, marco: 'PM05', celda: 2.5, tinta: 'cmyk' };
// Como las demás experiencias (plan 009): tutorial del kit una vez por sesión y después la herramienta.
type Paso = 'camara' | 'editar' | 'qr';
// Hub de experiencias: por defecto dos carpetas arriba (fotomaton/dist/ → Experiencias/).
const HUB_URL = (import.meta.env.VITE_HUB_URL as string | undefined) ?? '../../';

export function App() {
  const [visto, marcarVisto] = useTutorialVisto('fotomaton');
  const [paso, setPaso] = useState<Paso>('camara');
  const [visual, setVisual] = useState<Visual>(INICIAL.visual), [marcoId, setMarcoId] = useState(INICIAL.marco);
  const [celda, setCelda] = useState(INICIAL.celda), [tinta, setTinta] = useState(INICIAL.tinta);
  // Placas de impresión apagadas (canales de la trama), como el ojo de un canal en Photoshop.
  const [apagadas, setApagadas] = useState<string[]>([]), [lado, setLado] = useState<Lado>('user');
  const vivo = useRef<{ c: HTMLCanvasElement; cara: Cara | null } | null>(null);
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
    catch { setRevelando(false); setPaso('camara'); setAviso('No pudimos abrir esa imagen.'); }
  };

  const hacerTarjeta = () => exportarTarjeta(marcoMostrado, foto!.c, celda, TINTAS[tinta], foto!.cara, { apagadas: tienePlacas(porId(marcoMostrado).visual) ? apagadas : [] });
  const alternarPlaca = (canal: string) => setApagadas(a => (a.includes(canal) ? a.filter(x => x !== canal) : [...a, canal]));
  // Al cambiar de tinta cambian las placas (4, 2 o 1): vuelven todas a prenderse.
  const cambiarTinta = (k: string) => { setTinta(k); setApagadas([]); };

  const llevatela = async () => {
    setOcupado(true);
    try { setTarjeta(await hacerTarjeta()); setPaso('qr'); otorgarCreacion('fotomaton'); }
    catch { setAviso('No pudimos preparar la tarjeta.'); } finally { setOcupado(false); }
  };

  // Terminar (después del QR): vuelve a la cámara y limpia todo lo de la persona anterior.
  const terminar = () => {
    setFoto(null); setTarjeta(null); setRevelando(false);
    setCelda(INICIAL.celda); setTinta(INICIAL.tinta); setApagadas([]); setPaso('camara');
  };
  // Restablecer: además vuelve al lenguaje y al marco de partida.
  const restablecer = () => { terminar(); setVisual(INICIAL.visual); setMarcoId(INICIAL.marco); setLado('user'); };

  // Con una persona jugando, su tarjeta llega al inventario de su credencial, como lo que se crea en las otras mesas.
  // Solo después de que acepta el aviso y toca «Generar QR»: es cuando la tarjeta sale de la tablet (fotomaton/CLAUDE.md).
  const enviarAlInventario = async (blob: Blob) => {
    const codigo = jugador()?.codigo;
    if (!codigo) return;
    try {
      const bm = await createImageBitmap(blob), c = document.createElement('canvas');
      c.width = bm.width; c.height = bm.height; c.getContext('2d')!.drawImage(bm, 0, 0);
      await publicar('foto', { png: miniatura(c, 160) }, codigo);
    } catch { /* sin red: queda el timbre */ }
  };

  const destino = porId(marcoId), textoCambio = destino.visual + ' · ' + destino.name;
  // Las placas solo se aplican con la trama (Orgánica): con los otros efectos no existen.
  const placasActivas = tienePlacas(porId(marcoMostrado).visual) ? apagadas : [];
  const lateral = (
    <Panel visual={visual} elegirVisual={elegirVisual} marcoId={marcoId} setMarcoId={setMarcoId} miniaturas={miniaturas}
      celda={celda} setCelda={setCelda} tinta={tinta} setTinta={cambiarTinta} apagadas={apagadas} alternarPlaca={alternarPlaca}
      foto={paso !== 'camara' && !revelando ? foto : null} vivo={paso === 'camara' ? vivo : undefined}
      camara={paso === 'camara' ? { lado, setLado, alSubir: subir } : undefined} />
  );
  const restablecerEl = paso === 'camara'
    ? <BotonAccion icono="restart_alt" texto="Restablecer" onClick={restablecer} />
    : <Confirmar icono="restart_alt" texto="Restablecer" pregunta="¿Borrar la foto?" onConfirmar={restablecer} />;
  const input = <input ref={archivo} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={alArchivo} />;
  const avisoEl = <>{aviso ? <div className="aviso" role="status">{aviso}</div> : null}<Quiosco app="fotomaton" /></>;

  if (!visto) return (
    <>
      {input}
      <Tutorial etiqueta="Los tres lenguajes · imagen e identidad" titulo="Fotomatón" volver={HUB_URL}
        pasos={[
          { icono: 'photo_camera', texto: 'Sácate una foto: la cámara ya muestra el efecto y el marco.' },
          { icono: 'palette', texto: 'A la derecha eliges lenguaje, marco, efecto y tinta.' },
          { icono: 'ios_share', texto: 'Llévatela al celular con un QR. Queda 24 horas y después se borra.' },
        ]}
        acciones={[
          { texto: 'Abrir la cámara', icono: 'photo_camera', alTocar: () => { marcarVisto(); setPaso('camara'); } },
          { texto: 'Subir una foto', icono: 'image', alTocar: () => { marcarVisto(); subir(); } },
        ]} />
    </>
  );

  // Cámara y edición son la herramienta (barras fijas del kit); «Llévatela» se abre encima, como exportar en las otras mesas.
  return (
    <>
      {input}
      {paso === 'camara' ? (
        <Camara lado={lado} marco={marcoMostrado} celda={celda} tinta={tinta} apagadas={placasActivas} vivo={vivo} cambiando={cambiando} textoCambio={textoCambio} alSubir={subir}
          volver={HUB_URL} acciones={restablecerEl} lateral={lateral}
          alFoto={(f, c) => { revelar(); setFoto({ c: f, cara: c }); setPaso('editar'); }} />
      ) : (
        <Editor foto={foto} marco={marcoMostrado} celda={celda} tinta={tinta} apagadas={placasActivas} revelando={revelando} cambiando={cambiando}
          textoCambio={textoCambio} ocupado={ocupado} alLlevatela={llevatela} alOtra={() => setPaso('camara')}
          volver={HUB_URL} acciones={restablecerEl} lateral={lateral} />
      )}
      {paso === 'qr' && tarjeta && (
        <div className="k-quiosco" role="dialog" aria-modal="true" aria-labelledby="qr-t">
          <div className="k-panel caja-qr">
            <PasoQR blob={tarjeta} marco={marcoMostrado} tinta={tinta} conCredencial={!!jugador()?.codigo}
              alSubida={() => enviarAlInventario(tarjeta)} alTerminar={terminar} alVolver={() => setPaso('editar')} />
          </div>
        </div>
      )}
      {avisoEl}
    </>
  );
}
