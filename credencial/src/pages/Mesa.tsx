import React, { useEffect, useState } from 'react';
import { emparejarMesa, miCredencial, guardarMesaPendiente } from '../lib/store';
import type { Ir } from '../App';

// Jugar en una mesa (plan 014): abre el QR de la tablet, #/mesa?m=MESA&n=NONCE&a=APP. Deja la mesa asociada a esta
// credencial; la tablet se entera sola. Sin credencial, se guarda el pedido, se crea la credencial y se completa ahí.
const NOMBRES: Record<string, string> = {
  graffiti: 'Graffiti y Tags', mosaicos: 'Taller de Mosaicos', 'taller-mosaicos': 'Taller de Mosaicos', loops: 'Teatro de Papel',
  grabado: 'Taller de Grabado', fotomaton: 'Cabina de fotos', audioreactiva: 'Estación Audioreactiva', 'juego-pixel': 'Hora punta', vagon: 'Vagón',
};
export const nombreExperiencia = (app?: string) => (app && NOMBRES[app]) || 'la mesa';

export const Mesa: React.FC<{ mesa: string; nonce: string; app?: string; ir: Ir }> = ({ mesa, nonce, app, ir }) => {
  const [estado, setEstado] = useState<{ tipo: 'cargando' | 'error'; mensaje?: string }>({ tipo: 'cargando' });
  useEffect(() => {
    const codigo = miCredencial();
    if (!codigo) { guardarMesaPendiente({ mesa, nonce, app }); ir('#/crear'); return; }
    emparejarMesa(codigo, mesa, nonce, app)
      .then(() => ir(`#/c/${codigo}`, { aviso: `¡Listo! Ya juegas en ${nombreExperiencia(app)} con tu credencial. Lo que crees suma al timbre Creación.` }))
      .catch(e => setEstado({ tipo: 'error', mensaje: (e as Error).message }));
  }, [mesa, nonce, app, ir]);
  return (
    <main className="pantalla centrada">
      <p className="etq">Jugar en {nombreExperiencia(app)}</p>
      {estado.tipo === 'cargando' && <h2>Conectando con la mesa…</h2>}
      {estado.tipo === 'error' && (<>
        <h2>No pudimos conectar con la mesa</h2>
        <p>{estado.mensaje}</p>
        <button className="btn" onClick={() => ir('#/')}>Volver a mi credencial</button>
      </>)}
    </main>
  );
};
