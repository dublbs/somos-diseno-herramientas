import { useCallback, useEffect, useState } from "react";
import Crear from "./pages/Crear.jsx";
import Credencial from "./pages/Credencial.jsx";
import Sello from "./pages/Sello.jsx";
import { remoto } from "./lib/store.js";

// Rutas: /  ·  /c/SD-XXXXX  ·  /sello/1..5?t=TOKEN
function leerRuta(path) {
  const p = (path || "/").replace(/\/+$/, "") || "/";
  let m;
  if ((m = p.match(/^\/c\/([A-Za-z0-9-]+)$/))) return { vista: "carta", codigo: m[1].toUpperCase() };
  if ((m = p.match(/^\/sello\/([1-5])$/))) return { vista: "sello", mesa: Number(m[1]) };
  return { vista: "crear" };
}

export default function App() {
  const [ruta, setRuta] = useState(() => leerRuta(window.location.pathname));

  useEffect(() => {
    const alVolver = () => setRuta(leerRuta(window.location.pathname));
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  const ir = useCallback((path, extra = {}) => {
    // En modo demo (vista previa o GitHub Pages) se navega solo en memoria: así no se rompe al recargar en una subcarpeta.
    if (remoto) { try { window.history.pushState(null, "", path); } catch { /* sin historial */ } }
    setRuta({ ...leerRuta(path), ...extra });
    try { window.scrollTo(0, 0); } catch { /* nada */ }
  }, []);

  return (
    <div className="app">
      <header className="cabecera">
        <p className="eyebrow">Somos Diseño · Todas las formas del diseño · INACAP Sede Santiago Centro</p>
        <div className="titulo">
          <h1>{ruta.vista === "carta" ? "Tu credencial" : ruta.vista === "sello" ? "Sello de mesa" : "Arma tu personaje"}</h1>
          {!remoto && <span className="pill demo">Modo demo</span>}
        </div>
      </header>
      <main>
        {ruta.vista === "crear" && <Crear ir={ir} />}
        {ruta.vista === "carta" && <Credencial key={ruta.codigo} codigo={ruta.codigo} ir={ir} nueva={ruta.nueva} recienSellada={ruta.recienSellada} />}
        {ruta.vista === "sello" && <Sello mesa={ruta.mesa} ir={ir} />}
      </main>
    </div>
  );
}
