import { useEffect, useRef, useState } from "react";
import { componer, ESPERA, FPS, N } from "../pixel/generator.js";
import { pintarRetrato, DISENOS, CARTA } from "../pixel/render.js";
import { HEX } from "../pixel/palette.js";

// Reloj compartido de 12 fps (cuadro a cuadro, sin suavizado). Se detiene con movimiento reducido.
export function useCuadro() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let reducido = false;
    try { reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* sin matchMedia */ }
    if (reducido) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000 / FPS);
    return () => clearInterval(id);
  }, []);
  return ESPERA[tick % ESPERA.length];
}

export function Retrato({ receta, escala = 14, fondo = "Hueso", className, etiqueta }) {
  const ref = useRef(null);
  const cuadro = useCuadro();
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    pintarRetrato(ctx, componer(receta, cuadro), escala, { fondo });
  }, [receta, cuadro, escala, fondo]);
  return <canvas ref={ref} width={N * escala} height={N * escala} className={className} role="img" aria-label={etiqueta || "Personaje"} />;
}

export function Carta({ datos, escala = 4, className, diseno = "documento" }) {
  const ref = useRef(null);
  const cuadro = useCuadro();
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    (DISENOS.find((d) => d.id === diseno) || DISENOS[0]).pintar(ctx, datos, cuadro, escala);
  }, [datos, cuadro, escala, diseno]);
  return (
    <canvas
      ref={ref}
      width={CARTA.ancho * escala}
      height={CARTA.alto * escala}
      className={className}
      role="img"
      aria-label={`Credencial de ${datos.nombre}, diseño ${(DISENOS.find((d) => d.id === diseno) || DISENOS[0]).nombre}, ${datos.sellos?.length || 0} de 5 sellos`}
    />
  );
}

// Vista fija y pequeña del personaje, para los botones de selección de partes.
// recorte = { x, y, w } acerca la vista a una zona cuadrada (por ejemplo, la cara).
export function Miniatura({ receta, recorte, tam = 64 }) {
  const ref = useRef(null);
  const key = JSON.stringify(receta);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    const { x = 0, y = 0, w = N } = recorte || {};
    const s = tam / w;
    ctx.fillStyle = "#F4EEE3";
    ctx.fillRect(0, 0, tam, tam);
    const celdas = componer(receta, 0);
    for (let i = 0; i < N * N; i++) {
      const col = celdas[i];
      if (!col) continue;
      const cx = (i % N) - x, cy = Math.floor(i / N) - y;
      if (cx < 0 || cy < 0 || cx >= w || cy >= w) continue;
      ctx.fillStyle = HEX[col];
      ctx.fillRect(Math.round(cx * s), Math.round(cy * s), Math.ceil(s), Math.ceil(s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, recorte, tam]);
  return <canvas ref={ref} width={tam} height={tam} aria-hidden="true" />;
}
