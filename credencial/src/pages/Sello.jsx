import { useEffect, useState } from "react";
import { MESAS } from "../lib/mesas.js";
import { sellar, miCredencial } from "../lib/store.js";

// Página a la que lleva el QR impreso de cada mesa: /sello/3?t=TOKEN
export default function Sello({ mesa, ir }) {
  const [estado, setEstado] = useState({ tipo: "cargando" });
  const datosMesa = MESAS[mesa - 1];

  useEffect(() => {
    let token = "";
    try { token = new URLSearchParams(window.location.search).get("t") || ""; } catch { /* sin URL */ }
    const codigo = miCredencial();
    if (!codigo) return setEstado({ tipo: "sin-credencial" });
    sellar(codigo, mesa, token)
      .then(() => ir(`/c/${codigo}`, { recienSellada: mesa }))
      .catch((e) => setEstado({ tipo: "error", mensaje: e.message }));
  }, [mesa, ir]);

  return (
    <div className="aviso">
      <p className="eyebrow">Mesa {mesa} · {datosMesa.nombre}</p>
      {estado.tipo === "cargando" && <h2>Timbrando tu credencial…</h2>}
      {estado.tipo === "sin-credencial" && (
        <>
          <h2>Aún no tienes credencial en este celular</h2>
          <p>Créala aquí mismo o en la mesa 3. Después vuelve a escanear el QR de esta mesa para recibir el sello.</p>
          <button className="primario" onClick={() => ir("/")}>Crear mi personaje</button>
        </>
      )}
      {estado.tipo === "error" && (
        <>
          <h2>No pudimos timbrar</h2>
          <p>{estado.mensaje}</p>
          <button className="secundario" onClick={() => window.location.reload()}>Intentar de nuevo</button>
        </>
      )}
    </div>
  );
}
