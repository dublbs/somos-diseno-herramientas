import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Carta } from "../components/Pixel.jsx";
import { MESAS } from "../lib/mesas.js";
import { obtener, sellar, remoto, guardarMiCredencial } from "../lib/store.js";
import { cartaEnLienzo, hojaDeSprites, moduloEnLienzo, aBlob, DISENOS } from "../pixel/render.js";
import { manifiesto } from "../pixel/generator.js";
import { guardarArchivo } from "../lib/archivo.js";

export default function Credencial({ codigo, ir, nueva, recienSellada }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [estado, setEstado] = useState("");
  const [lado, setLado] = useState(0); // índice en DISENOS: 0 = frente, 1 = reverso

  const cargar = useCallback(() => obtener(codigo).then(setDatos).catch((e) => setError(e.message)), [codigo]);

  useEffect(() => {
    cargar();
    let mia = false;
    try { mia = new URLSearchParams(window.location.search).has("mia"); } catch { /* sin URL */ }
    if (mia) guardarMiCredencial(codigo);
  }, [cargar, codigo]);

  // Con Supabase, la carta se refresca sola para mostrar sellos nuevos.
  useEffect(() => {
    if (!remoto) return;
    const id = setInterval(cargar, 8000);
    return () => clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    if (!remoto) return;
    const enlace = `${window.location.origin}/c/${codigo}?mia=1`;
    QRCode.toDataURL(enlace, { margin: 1, width: 360, color: { dark: "#000000ff", light: "#F4EEE3ff" } }).then(setQr).catch(() => setQr(""));
  }, [codigo]);

  if (error) {
    return (
      <div className="aviso">
        <h2>No encontramos esa credencial</h2>
        <p>{error}</p>
        <button className="primario" onClick={() => ir("/")}>Crear una credencial</button>
      </div>
    );
  }
  if (!datos) return <p className="cargando">Buscando la credencial…</p>;

  const base = `${datos.codigo.toLowerCase()}-${datos.nombre.toLowerCase().replace(/[^a-z0-9ñ]+/g, "-")}`;
  const bajar = async (nombre, crearDatos) => {
    setEstado("Preparando " + nombre + "…");
    const r = await guardarArchivo(nombre, await crearDatos());
    setEstado(r === "cancelado" ? "Descarga cancelada." : r === "ocupado" ? "Ya hay una descarga pendiente." : "Listo: " + nombre);
  };
  const simular = async (n) => {
    await sellar(datos.codigo, n, "demo");
    cargar();
  };
  const completos = datos.sellos.length;

  return (
    <div className="credencial">
      <section className="escritorio mesa-carta" aria-label="Credencial">
        {nueva && <p className="sello-aviso">Credencial emitida. Recorre las 5 mesas y junta todos los sellos.</p>}
        {recienSellada && <p className="sello-aviso">Sello de la mesa {recienSellada} · {MESAS[recienSellada - 1].nombre}</p>}
        <button
          type="button"
          className={"giro" + (lado ? " volteada" : "")}
          onClick={() => setLado((l) => (l + 1) % DISENOS.length)}
          aria-label={`Girar credencial. Ahora: ${DISENOS[lado].nombre}`}
        >
          <span className="giro-interior">
            <span className="cara frente"><Carta datos={datos} escala={4} className="carta" diseno={DISENOS[0].id} /></span>
            <span className="cara atras"><Carta datos={datos} escala={4} className="carta" diseno={DISENOS[1].id} /></span>
          </span>
        </button>
        <div className="lados" role="group" aria-label="Diseño de la credencial">
          {DISENOS.map((d, i) => (
            <button key={d.id} type="button" className="secundario chico" aria-pressed={lado === i} onClick={() => setLado(i)}>{d.nombre}</button>
          ))}
          <span className="nota">Toca la credencial para girarla.</span>
        </div>
        <p className="progreso"><strong>{completos} de 5</strong> sellos{completos === 5 ? " · ¡Credencial completa! Pasa a buscar tu sticker." : ""}</p>
      </section>

      <aside className="controles">
        {remoto && qr && (
          <div className="qr">
            <img src={qr} alt={`Código QR para llevarte la credencial ${datos.codigo}`} />
            <p>Escanéala con tu celular para llevártela. En cada mesa, escanea su QR y se suma el sello.</p>
          </div>
        )}

        <h2>Sellos</h2>
        <ul className="sellos">
          {MESAS.map((m) => {
            const ok = datos.sellos.includes(m.n);
            return (
              <li key={m.n} className={ok ? "ok" : ""}>
                <span className="num">M{m.n}</span>
                <span><strong>{m.nombre}</strong><small>{m.detalle}</small></span>
                {remoto ? (
                  <span className="pill">{ok ? "Sellada" : "Pendiente"}</span>
                ) : (
                  <button type="button" className="secundario chico" disabled={ok} onClick={() => simular(m.n)}>{ok ? "Sellada" : "Simular sello"}</button>
                )}
              </li>
            );
          })}
        </ul>
        {!remoto && <p className="nota demo">Modo demo: en el evento, el sello llega al escanear el QR de cada mesa.</p>}

        <h2>Descargar</h2>
        <div className="descargas">
          <button type="button" className="primario" onClick={() => bajar(`${base}-${DISENOS[lado].id}.png`, () => aBlob(cartaEnLienzo(datos, 8, 0, DISENOS[lado].id)))}>Este lado en PNG</button>
          <button type="button" className="secundario" onClick={() => bajar(`${base}-modulo.png`, () => aBlob(moduloEnLienzo(datos.receta, 10)))}>Módulo 240 px</button>
          <button type="button" className="secundario" onClick={() => bajar(`${base}-sprites.png`, () => aBlob(hojaDeSprites(datos.receta, 10)))}>Hoja de sprites</button>
          <button type="button" className="secundario" onClick={() => bajar(`${base}.json`, () => JSON.stringify(manifiesto(datos.receta, { nombre: datos.nombre, codigo: datos.codigo }), null, 2))}>Receta JSON</button>
        </div>
        <p className="estado" role="status">{estado}</p>
        <button type="button" className="enlace" onClick={() => ir("/")}>Crear otro personaje</button>
      </aside>
    </div>
  );
}
