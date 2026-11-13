import React, { useEffect, useState } from 'react';
import { canjear, miCredencial, obtener, remoto } from '../lib/store';
import { completa, pinDeDemo } from '../../../shared/juego';
import type { DatosCarta } from '../pixel/render';
import type { Ir, PonerTema } from '../App';

// Canje del premio: con la credencial completa, la persona muestra esta pantalla y el staff escribe su PIN.
// Con Supabase el PIN, el stock y el límite diario los valida el servidor; el staff también puede canjear desde el PC madre.
export const Canje: React.FC<{ ir: Ir; ponerTema: PonerTema }> = ({ ir, ponerTema }) => {
  const codigo = miCredencial();
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [pin, setPin] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    obtener(codigo).then(d => { setDatos(d); ponerTema(d.marco); }).catch(e => setAviso((e as Error).message));
  }, [codigo, ponerTema]);

  if (!codigo) return (
    <main className="pantalla centrada">
      <h2>Primero crea tu credencial</h2>
      <button className="btn primario" onClick={() => ir('#/crear')}>Crear mi credencial</button>
    </main>
  );
  if (!datos) return <main className="pantalla centrada"><p>{aviso || 'Buscando tu credencial…'}</p></main>;

  const validar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setAviso('');
    try { await canjear(datos.codigo, pin); setDatos({ ...datos, canjeado: true }); }
    catch (err) { setAviso((err as Error).message); }
    setEnviando(false);
  };

  return (
    <main className="pantalla centrada canje">
      <p className="etq">Canje del premio</p>
      <p className="canje-codigo">{datos.codigo}</p>
      <h2>{datos.nombre}</h2>
      {datos.canjeado ? (
        <>
          <p className="canje-sello" role="status">¡Canjeado!</p>
          <p>Gracias por recorrer la Semana del Diseño con nosotros.</p>
        </>
      ) : !completa(datos.sellos) ? (
        <p>Todavía te faltan timbres. Complétalos y vuelve a esta pantalla para canjear tu premio.</p>
      ) : (
        <form className="codigo-sello" onSubmit={validar}>
          <p>Muestra esta pantalla al equipo de Somos Diseño. Pídele que escriba su PIN para entregarte tu premio.</p>
          <div className="pie-movil">
            <input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder={!remoto && pinDeDemo() ? 'PIN (demo 0000)' : 'PIN del staff'} aria-label="PIN del staff" />
            <button className="btn primario" disabled={enviando || pin.length < 4}>{enviando ? 'Validando…' : 'Validar'}</button>
          </div>
          {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
        </form>
      )}
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir('#/')}>Volver a mi credencial</button>
      </div>
    </main>
  );
};
