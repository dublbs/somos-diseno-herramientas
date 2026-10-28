import React, { useEffect, useState } from 'react';
import { sellar, miCredencial } from '../lib/store';
import type { Ir } from '../App';

// Página que abre el QR impreso de cada sello: #/sello/2?t=TOKEN
export const Sello: React.FC<{ sello: number; token: string; ir: Ir }> = ({ sello, token, ir }) => {
  const [estado, setEstado] = useState<{ tipo: 'cargando' | 'sin-credencial' | 'error'; mensaje?: string }>({ tipo: 'cargando' });

  useEffect(() => {
    const codigo = miCredencial();
    if (!codigo) { setEstado({ tipo: 'sin-credencial' }); return; }
    sellar(codigo, sello, token)
      .then(() => ir(`#/c/${codigo}`, { timbre: sello }))
      .catch(e => setEstado({ tipo: 'error', mensaje: (e as Error).message }));
  }, [sello, token, ir]);

  return (
    <main className="pantalla centrada">
      <p className="etq">Sello {sello}</p>
      {estado.tipo === 'cargando' && <h2>Timbrando tu credencial…</h2>}
      {estado.tipo === 'sin-credencial' && (
        <>
          <h2>Aún no tienes credencial en este celular</h2>
          <p>Créala aquí mismo y después vuelve a escanear este QR para recibir el sello.</p>
          <button className="btn primario" onClick={() => ir('#/crear')}>Crear mi credencial</button>
        </>
      )}
      {estado.tipo === 'error' && (
        <>
          <h2>No pudimos timbrar</h2>
          <p>{estado.mensaje}</p>
          <button className="btn" onClick={() => ir('#/')}>Volver a mi credencial</button>
        </>
      )}
    </main>
  );
};
