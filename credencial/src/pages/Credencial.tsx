import React, { useCallback, useEffect, useState } from 'react';
import { Carta } from '../components/Pixel';
import { obtener, sellar, remoto, guardarMiCredencial, olvidarMiCredencial, miCredencial, fotoDe } from '../lib/store';
import { cargarImagen } from '../lib/foto';
import { guardarArchivo } from '../lib/descargar';
import { cartaEnLienzo, aBlob, SELLOS, type Cara, type DatosCarta } from '../pixel/render';
import type { Ir } from '../App';

const CARAS: Cara[] = ['frente', 'hello', 'foto'];
const NOMBRE_CARA: Record<Cara, string> = { frente: 'credencial', hello: 'HELLO my name is', foto: 'Fotomatón' };

export const Credencial: React.FC<{ codigo: string; aviso?: string; cara?: Cara; ir: Ir }> = ({ codigo, aviso, cara, ir }) => {
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [error, setError] = useState('');
  const [lado, setLado] = useState<Cara>(cara || 'frente');
  const [foto, setFoto] = useState<HTMLImageElement | null>(null);
  const [estado, setEstado] = useState(aviso || '');

  const cargar = useCallback(() => obtener(codigo).then(setDatos).catch(e => setError((e as Error).message)), [codigo]);
  useEffect(() => { cargar(); if (!miCredencial()) guardarMiCredencial(codigo); }, [cargar, codigo]);
  useEffect(() => {
    const src = fotoDe(codigo);
    if (src) cargarImagen(src).then(setFoto).catch(() => setFoto(null));
  }, [codigo]);
  // Con Supabase, la credencial se refresca sola para mostrar sellos nuevos.
  useEffect(() => { if (!remoto) return; const id = setInterval(cargar, 8000); return () => clearInterval(id); }, [cargar]);
  useEffect(() => { if (!estado) return; const t = setTimeout(() => setEstado(''), 4000); return () => clearTimeout(t); }, [estado]);

  if (error) {
    return (
      <main className="pantalla centrada">
        <h2>No encontramos esa credencial</h2>
        <p>{error}</p>
        <button className="btn primario" onClick={() => { olvidarMiCredencial(); ir('#/crear'); }}>Crear mi credencial</button>
      </main>
    );
  }
  if (!datos) return <main className="pantalla centrada"><p>Buscando tu credencial…</p></main>;

  const completos = datos.sellos.length;
  const conFoto = { ...datos, foto };
  const descargar = async () => {
    try {
      const blob = await aBlob(cartaEnLienzo(conFoto, 4, 0, lado));
      await guardarArchivo(blob, `credencial-${datos.codigo.toLowerCase()}-${lado}.png`);
    } catch (e) {
      const codigo = (e as { code?: string }).code;
      if (codigo !== 'declined') setEstado('No se pudo guardar la imagen.');
    }
  };
  // Modo demo: permite probar el recorrido sin los QR impresos.
  const simular = async () => {
    const n = Array.from({ length: SELLOS }, (_, i) => i + 1).find(i => !datos.sellos.includes(i));
    if (!n) return;
    await sellar(datos.codigo, n, 'demo');
    setEstado(`Sello ${n} de ${SELLOS}`);
    cargar();
  };

  return (
    <main className="pantalla credencial">
      <button type="button" className="giro" onClick={() => setLado(l => CARAS[(CARAS.indexOf(l) + 1) % CARAS.length])}
        aria-label={`Girar credencial. Ahora: ${NOMBRE_CARA[lado]}`}>
        <Carta datos={conFoto} diseno={lado} className="carta" />
      </button>
      <p className="progreso" role="status">
        {estado || (completos === SELLOS ? '¡Credencial completa!' : `${completos} de ${SELLOS} sellos · toca para girar (${CARAS.indexOf(lado) + 1}/3)`)}
      </p>
      <div className="acciones-movil">
        <button type="button" className="btn primario" onClick={() => ir('#/escanear')}>
          <span className="material-symbols-outlined" aria-hidden="true">highlight_alt</span>Sellar
        </button>
        <button type="button" className="btn" onClick={() => ir('#/foto')}>
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Foto
        </button>
        <button type="button" className="btn" onClick={descargar}>
          <span className="material-symbols-outlined" aria-hidden="true">download</span>Guardar
        </button>
        {!remoto && completos < SELLOS && (
          <button type="button" className="btn" onClick={simular}>Simular</button>
        )}
      </div>
    </main>
  );
};
