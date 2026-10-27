import { useMemo, useState } from "react";
import { Retrato, Miniatura } from "../components/Pixel.jsx";
import { PARTES, RANURAS } from "../pixel/parts.js";
import { recetaAlAzar, lenguaje, coloresUsados, parte, tieneZona, cabeEnPaleta, avisos } from "../pixel/generator.js";
import { HEX, COLORES_PIEL, COLORES_ELEGIBLES, MAX_COLORES } from "../pixel/palette.js";
import { crear, limpiarNombre, remoto, guardarMiCredencial } from "../lib/store.js";

export default function Crear({ ir }) {
  const [receta, setReceta] = useState(() => recetaAlAzar(Date.now()));
  const [pestana, setPestana] = useState("cabeza");
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("");
  const [aviso, setAviso] = useState("");
  const [creando, setCreando] = useState(false);
  const usados = useMemo(() => coloresUsados(receta), [receta]);
  const alertas = useMemo(() => avisos(receta), [receta]);

  const ranura = RANURAS.find((r) => r.id === pestana);
  const actual = parte(pestana, receta[pestana]);

  const elegirParte = (id) => {
    setAviso("");
    setReceta({ ...receta, [pestana]: id });
  };

  const elegirColor = (llave, color) => {
    if (!cabeEnPaleta(receta, llave, color)) {
      const lista = usados.filter((c) => c !== "Negro").join(", ");
      setAviso(`Máximo ${MAX_COLORES} colores por personaje, contando el Negro del contorno. Usa uno de los que ya tienes (${lista} o Negro) o cambia otra característica primero.`);
      return;
    }
    setAviso("");
    setReceta({ ...receta, colores: { ...receta.colores, [llave]: color } });
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!limpiarNombre(nombre)) return setEstado("Escribe un nombre para la credencial.");
    setCreando(true);
    setEstado("Emitiendo credencial…");
    try {
      const { codigo } = await crear({ nombre, receta });
      guardarMiCredencial(codigo);
      ir(`/c/${codigo}`, { nueva: true });
    } catch (err) {
      setEstado("No se pudo crear la credencial: " + err.message);
      setCreando(false);
    }
  };

  const filasColor = ranura.colores.filter((c) => !c.soloSi || tieneZona(pestana, receta[pestana], c.soloSi));

  return (
    <div className="crear">
      <section className="escritorio" aria-label="Vista previa del personaje">
        <div className="hoja">
          <Retrato receta={receta} escala={14} className="retrato" etiqueta="Tu personaje" />
          <dl className="ficha">
            <div><dt>Lenguaje</dt><dd>{lenguaje(receta)}</dd></div>
            <div><dt>Colores</dt><dd>{usados.length} de {MAX_COLORES} · Línea azul</dd></div>
          </dl>
        </div>
        <form className="emitir" onSubmit={enviar}>
          <label htmlFor="nombre">Nombre en la credencial</label>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={20} autoComplete="off" placeholder="Ej. PIPE" />
          <p className="nota">Se imprime así: <span className="mono">{limpiarNombre(nombre) || "—"}</span></p>
          <button className="primario" disabled={creando}>Emitir credencial</button>
          <p className="estado" role="status">{estado}</p>
        </form>
      </section>

      <section className="controles" aria-label="Personalización">
        <div className="fila-titulo">
          <h2>Personaliza</h2>
          <button type="button" className="secundario" onClick={() => { setAviso(""); setReceta(recetaAlAzar(Date.now())); }}>Al azar</button>
        </div>

        <div className="paleta" aria-live="polite">
          <span className="etiqueta">Paleta del personaje · {usados.length} de {MAX_COLORES}</span>
          <ul>
            {usados.map((c) => (
              <li key={c}><i style={{ background: HEX[c] }} />{c}</li>
            ))}
            {Array.from({ length: Math.max(0, MAX_COLORES - usados.length) }, (_, i) => (
              <li key={"libre" + i} className="libre"><i />Libre</li>
            ))}
          </ul>
        </div>

        <div className="pestanas" role="tablist" aria-label="Características">
          {RANURAS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              id={"tab-" + r.id}
              aria-selected={pestana === r.id}
              aria-controls="panel-caracteristica"
              onClick={() => { setPestana(r.id); setAviso(""); }}
            >
              {r.nombre}
            </button>
          ))}
        </div>

        <div className="panel" role="tabpanel" id="panel-caracteristica" aria-labelledby={"tab-" + pestana}>
          <div className="zona-titulo">
            <span className="etiqueta">Forma</span>
            <b>{actual.nombre}{actual.lenguaje ? ` · ${actual.lenguaje}` : ""}</b>
          </div>
          <div className="opciones" role="radiogroup" aria-label={`Forma de ${ranura.nombre.toLowerCase()}`}>
            {PARTES[pestana].map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={receta[pestana] === p.id}
                aria-label={p.lenguaje ? `${p.nombre}, ${p.lenguaje}` : p.nombre}
                title={p.nombre}
                className="opcion"
                onClick={() => elegirParte(p.id)}
              >
                <Miniatura receta={{ ...receta, [pestana]: p.id }} recorte={ranura.recorte} tam={64} />
                <span>{p.nombre}</span>
              </button>
            ))}
          </div>

          {filasColor.map((fc) => {
            const opciones = fc.id === "cabeza" ? COLORES_PIEL : COLORES_ELEGIBLES;
            const sinUso = (pestana === "mejillas" && receta.mejillas === "ninguna") || (pestana === "pelo" && receta.pelo === "ninguno" && fc.id === "pelo" && receta.boca !== "bigote") || (pestana === "accesorio" && receta.accesorio === "ninguno");
            return (
              <div key={fc.id} className={"zona-color" + (sinUso ? " apagada" : "")}>
                <div className="zona-titulo">
                  <span className="etiqueta">{fc.nombre}</span>
                  <b>{receta.colores[fc.id]}</b>
                </div>
                <div className="chips" role="radiogroup" aria-label={`${fc.nombre} de ${ranura.nombre.toLowerCase()}`}>
                  {opciones.map((c) => {
                    const cabe = cabeEnPaleta(receta, fc.id, c);
                    return (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={receta.colores[fc.id] === c}
                        aria-label={cabe ? c : `${c}, superaría ${MAX_COLORES} colores`}
                        title={cabe ? c : `${c}: superaría ${MAX_COLORES} colores`}
                        className={"chip" + (cabe ? "" : " fuera") + (usados.includes(c) ? " en-paleta" : "")}
                        style={{ "--c": HEX[c] }}
                        onClick={() => elegirColor(fc.id, c)}
                      />
                    );
                  })}
                </div>
                {sinUso && <p className="nota">Elige una forma para ver este color.</p>}
              </div>
            );
          })}
          {pestana === "boca" && receta.boca === "bigote" && <p className="nota">El bigote usa el color del pelo.</p>}
          {pestana === "pelo" && receta.pelo === "ninguno" && receta.boca === "bigote" && <p className="nota">Este color también pinta el bigote.</p>}
        </div>

        {aviso && <p className="aviso-color" role="alert">{aviso}</p>}
        {alertas.length > 0 && (
          <ul className="alertas">
            {alertas.map((a) => <li key={a}>{a}</li>)}
          </ul>
        )}
        <p className="nota">Regla del sistema: hasta {MAX_COLORES} colores por personaje, contando el Negro del contorno. Los colores con borde punteado no caben en la paleta actual; los marcados con un punto ya están en uso.</p>
        {!remoto && <p className="nota demo">Modo demo: las credenciales quedan guardadas solo en este dispositivo.</p>}
      </section>
    </div>
  );
}
