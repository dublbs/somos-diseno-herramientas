import React, { useEffect, useState } from 'react';
import { encontrarAfiche, miCredencial } from '../lib/store';
import { nombreAfiche } from '../lib/afiches';
import type { Ir } from '../App';

// Página que abre el QR de un afiche desde la cámara del sistema: #/afiche/SECRETO (plan 010).
export const Afiche: React.FC<{ secreto: string; ir: Ir }> = ({ secreto, ir }) => {
  const [estado, setEstado] = useState<{ tipo: 'cargando' | 'sin-credencial' | 'error'; mensaje?: string }>({ tipo: 'cargando' });

  useEffect(() => {
    const codigo = miCredencial();
    if (!codigo) { setEstado({ tipo: 'sin-credencial' }); return; }
    encontrarAfiche(codigo, secreto)
      .then(r => {
        if (r.nuevo) ir(`#/c/${codigo}`, { timbre: 3 });
        else ir('#/juego', { aviso: r.repetido ? `Ya tenías el afiche ${nombreAfiche(r.afiche)}.` : `¡Afiche encontrado! ${r.pasos} de ${r.meta}` });
      })
      .catch(e => setEstado({ tipo: 'error', mensaje: (e as Error).message }));
  }, [secreto, ir]);

  return (
    <main className="pantalla centrada">
      <p className="etq">Cacería de afiches</p>
      {estado.tipo === 'cargando' && <h2>Sumando el afiche…</h2>}
      {estado.tipo === 'sin-credencial' && (
        <>
          <h2>Aún no tienes credencial en este navegador</h2>
          <p>Si ya la tienes en la pantalla de inicio, ábrela desde ahí y usa «Buscar afiches». Si no, créala aquí.</p>
          <button className="btn primario" onClick={() => ir('#/crear')}>Crear mi credencial</button>
        </>
      )}
      {estado.tipo === 'error' && (
        <>
          <h2>No pudimos sumar el afiche</h2>
          <p>{estado.mensaje}</p>
          <button className="btn" onClick={() => ir('#/juego')}>Ir al juego</button>
        </>
      )}
    </main>
  );
};
