import { useEffect, useState } from 'react';
import { generarQR, hayBackend, publicarTarjeta } from '../lib/publicar';

interface Props {
  blob: Blob; marco: string; tinta: string;
  alTerminar: () => void; alVolver: () => void;
}

type Estado = { fase: 'aviso' } | { fase: 'subiendo' } | { fase: 'listo'; qr: string; enlace: string } | { fase: 'error' };

// Llévatela: aviso de privacidad → sube solo la tarjeta final → QR grande.
export function PasoQR({ blob, marco, tinta, alTerminar, alVolver }: Props) {
  const [estado, setEstado] = useState<Estado>({ fase: 'aviso' });
  const subir = async () => {
    setEstado({ fase: 'subiendo' });
    try {
      const { enlace } = await publicarTarjeta(blob, marco, tinta);
      setEstado({ fase: 'listo', qr: await generarQR(enlace), enlace });
    } catch (e) { console.warn(e); setEstado({ fase: 'error' }); }
  };
  useEffect(() => () => setEstado({ fase: 'aviso' }), []);

  return (
    <div className="qr-wrap">
      {estado.fase === 'aviso' && <>
        <h2>Llévatela al celular</h2>
        <p className="bajada" style={{ margin: 0 }}>Tu foto queda disponible 24 horas para descargarla y después se borra.</p>
        <div className="acciones" style={{ marginTop: 0 }}>
          <button className="btn primario" onClick={subir}>Generar QR</button>
          <button className="btn" onClick={alVolver}>Volver</button>
        </div>
      </>}
      {estado.fase === 'subiendo' && <h2>Subiendo tu tarjeta…</h2>}
      {estado.fase === 'listo' && <>
        <h2>Escanea y te la llevas</h2>
        <div className="qr-caja"><img src={estado.qr} alt={`Código QR para descargar tu tarjeta: ${estado.enlace}`} /></div>
        <p className="ayuda" style={{ margin: 0 }}>Apunta la cámara del celular al código. Está disponible 24 horas.</p>
        {!hayBackend && <p className="ayuda" style={{ margin: 0 }}>Modo de prueba: sin servidor conectado, este QR solo abre en este mismo dispositivo.</p>}
        <div className="acciones" style={{ marginTop: 0 }}><button className="btn primario" onClick={alTerminar}>Terminar</button></div>
      </>}
      {estado.fase === 'error' && <>
        <h2>No pudimos subirla</h2>
        <p className="bajada" style={{ margin: 0 }}>Revisa la conexión e inténtalo de nuevo. Tu foto sigue solo en esta tablet.</p>
        <div className="acciones" style={{ marginTop: 0 }}>
          <button className="btn primario" onClick={subir}>Reintentar</button>
          <button className="btn" onClick={alVolver}>Volver</button>
        </div>
      </>}
    </div>
  );
}
