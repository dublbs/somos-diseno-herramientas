import React, { useCallback, useEffect, useState } from 'react';
import { Carta } from '../components/Pixel';
import { obtener, sellar, remoto, guardarMiCredencial, olvidarMiCredencial, miCredencial } from '../lib/store';
import { cartaEnLienzo, aBlob, SELLOS, type DatosCarta } from '../pixel/render';
import type { Ir } from '../App';

export const Credencial: React.FC<{ codigo: string; aviso?: string; ir: Ir }> = ({ codigo, aviso, ir }) => {
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [error, setError] = useState('');
  const [lado, setLado] = useState<'frente' | 'hello'>('frente');
  const [estado, setEstado] = useState(aviso || '');

  const cargar = useCallback(() => obtener(codigo).then(setDatos).catch(e => setError((e as Error).message)), [codigo]);
  useEffect(() => { cargar(); if (!miCredencial()) guardarMiCredencial(codigo); }, [cargar, codigo]);
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
  const descargar = async () => {
    const blob = await aBlob(cartaEnLienzo(datos, 4, 0, lado));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `credencial-${datos.codigo.toLowerCase()}-${lado}.png`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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
      <button type="button" className="giro" onClick={() => setLado(l => (l === 'frente' ? 'hello' : 'frente'))}
        aria-label={`Girar credencial. Ahora: ${lado === 'frente' ? 'credencial' : 'HELLO my name is'}`}>
        <Carta datos={datos} diseno={lado} className="carta" />
      </button>
      <p className="progreso" role="status">
        {estado || (completos === SELLOS ? '¡Credencial completa!' : `${completos} de ${SELLOS} sellos · toca la credencial para girarla`)}
      </p>
      <div className="acciones-movil">
        <button type="button" className="btn primario" onClick={() => ir('#/escanear')}>
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Escanear
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
