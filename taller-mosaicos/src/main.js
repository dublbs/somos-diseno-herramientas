import { FORMAS, forma, usaA, usaB, U, reflejarH, reflejarV, girar } from "./formas.js";
import "./estilos.css";

// ---------- paleta Línea azul ----------
const HEX = {
  Hueso: "#F4EEE3", Blanco: "#FFFFFF", Negro: "#000000", Azul: "#0062B8", "Lapislázuli": "#2B4BD8",
  Celeste: "#7FC8F8", Amarillo: "#FFC20E", Verde: "#00A651", Rosa: "#FF8FB1", Morado: "#7A2E8E",
};
const COLORES = Object.keys(HEX);
const MAX_COLORES = 4; // regla 3: un fondo y hasta tres colores de figura

// ---------- formatos (en celdas) ----------
const FORMATOS = [
  { id: "post", nombre: "Post 4:5 · 1080 × 1350", cols: 8, filas: 10, celda: 135 },
  { id: "cuadrado", nombre: "Cuadrado · 1080 × 1080", cols: 8, filas: 8, celda: 135 },
  { id: "historia", nombre: "Historia · 1080 × 1920", cols: 9, filas: 16, celda: 120 },
  { id: "pantalla", nombre: "Pantalla · 1920 × 1080", cols: 16, filas: 9, celda: 120 },
  { id: "figura4", nombre: "Figura 4 × 4 · 480 px", cols: 4, filas: 4, celda: 120 },
  { id: "modulo", nombre: "Módulo 2 × 2 · 240 px", cols: 2, filas: 2, celda: 120 },
];

// ---------- almacenamiento local (puede no existir) ----------
const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

// ---------- estado ----------
const guardado = leer("geo:estado", null);
const S = {
  formato: guardado?.formato || "post",
  celdas: guardado?.celdas || {}, // "x,y" → { f: forma, r, e, c: { f, a, b } }
  pincel: guardado?.pincel || { tipo: "forma", id: "media", r: 0, e: false, c: { f: "Rosa", a: "Lapislázuli", b: "Amarillo" } },
  herramienta: "poner",
  pestana: "base",
  sel: null, // { x, y, w, h }
  hover: null,
  grilla: true,
};
let misFiguras = leer("geo:figuras", []);
const fmt = () => FORMATOS.find((f) => f.id === S.formato) || FORMATOS[0];
const persistir = () => guardar("geo:estado", { formato: S.formato, celdas: S.celdas, pincel: S.pincel });
const k = (x, y) => x + "," + y;
const dentro = (x, y) => x >= 0 && y >= 0 && x < fmt().cols && y < fmt().filas;

// ---------- dibujo ----------
const cacheTrazos = new Map();
const trazo = (d) => { if (!cacheTrazos.has(d)) cacheTrazos.set(d, new Path2D(d)); return cacheTrazos.get(d); };

function pintarCelda(ctx, cel, X, Y, tam) {
  ctx.fillStyle = HEX[cel.c.f];
  ctx.fillRect(X, Y, tam, tam);
  const capas = forma(cel.f).capas;
  if (!capas.length) return;
  ctx.save();
  ctx.translate(X, Y);
  ctx.scale(tam / U, tam / U);
  ctx.translate(U / 2, U / 2);
  ctx.rotate((cel.r * Math.PI) / 2);
  if (cel.e) ctx.scale(-1, 1);
  ctx.translate(-U / 2, -U / 2);
  for (const [d, ranura] of capas) {
    ctx.fillStyle = HEX[cel.c[ranura]];
    ctx.fill(trazo(d), "evenodd");
  }
  ctx.restore();
}

function celdasDelPincel() {
  const p = S.pincel;
  if (p.tipo === "forma") return { w: 1, h: 1, celdas: [{ x: 0, y: 0, f: p.id, r: p.r, e: p.e, c: { ...p.c } }] };
  const fig = misFiguras.find((m) => m.id === p.id);
  if (!fig) return { w: 1, h: 1, celdas: [] };
  return { w: fig.w, h: fig.h, celdas: fig.celdas };
}

function pintar(ctx, escala, guias) {
  const F = fmt(), t = F.celda * escala;
  ctx.fillStyle = HEX.Hueso;
  ctx.fillRect(0, 0, F.cols * t, F.filas * t);
  for (const [clave, cel] of Object.entries(S.celdas)) {
    const [x, y] = clave.split(",").map(Number);
    if (dentro(x, y)) pintarCelda(ctx, cel, x * t, y * t, t);
  }
  if (!guias) return;
  if (S.grilla) {
    ctx.strokeStyle = "rgba(0,0,0,.16)";
    ctx.lineWidth = Math.max(1, 2 * escala);
    ctx.beginPath();
    for (let x = 1; x < F.cols; x++) { ctx.moveTo(x * t, 0); ctx.lineTo(x * t, F.filas * t); }
    for (let y = 1; y < F.filas; y++) { ctx.moveTo(0, y * t); ctx.lineTo(F.cols * t, y * t); }
    ctx.stroke();
  }
  const marcar = (x, y, w, h, color, guion) => {
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    if (guion) ctx.setLineDash([14, 10]);
    ctx.strokeRect(x * t + 3, y * t + 3, w * t - 6, h * t - 6);
    ctx.restore();
  };
  if (S.sel) marcar(S.sel.x, S.sel.y, S.sel.w, S.sel.h, "#FFC20E", true);
  if (S.hover && dentro(S.hover.x, S.hover.y)) {
    const { x, y } = S.hover;
    if (S.herramienta === "poner") {
      const b = celdasDelPincel();
      ctx.globalAlpha = 0.75;
      b.celdas.forEach((c) => dentro(x + c.x, y + c.y) && pintarCelda(ctx, c, (x + c.x) * t, (y + c.y) * t, t));
      ctx.globalAlpha = 1;
      marcar(x, y, b.w, b.h, "#000");
    } else if (S.herramienta !== "seleccionar") {
      marcar(x, y, 1, 1, S.herramienta === "borrar" ? "#E2001A" : "#000");
    }
  }
}

// ---------- reglas ----------
function coloresUsados(celdas = S.celdas) {
  const set = new Set();
  for (const [clave, cel] of Object.entries(celdas)) {
    const [x, y] = clave.split(",").map(Number);
    if (!dentro(x, y)) continue;
    set.add(cel.c.f);
    if (usaA(cel.f)) set.add(cel.c.a);
    if (usaB(cel.f)) set.add(cel.c.b);
  }
  if (Object.keys(celdas).length < fmt().cols * fmt().filas) set.add("Hueso");
  return [...set];
}

// ---------- edición ----------
function aplicar(x, y) {
  if (!dentro(x, y)) return;
  const clave = k(x, y), cel = S.celdas[clave];
  switch (S.herramienta) {
    case "poner": {
      const b = celdasDelPincel();
      b.celdas.forEach((c) => {
        if (!dentro(x + c.x, y + c.y)) return;
        S.celdas[k(x + c.x, y + c.y)] = { f: c.f, r: c.r, e: c.e, c: { ...c.c } };
      });
      break;
    }
    case "girar": if (cel) S.celdas[clave] = { ...cel, ...girar(cel) }; break;
    case "reflejar": if (cel) S.celdas[clave] = { ...cel, ...reflejarH(cel) }; break;
    case "borrar": delete S.celdas[clave]; break;
    case "gotero":
      if (cel) {
        S.pincel = { tipo: "forma", id: cel.f, r: cel.r, e: cel.e, c: { ...cel.c } };
        S.herramienta = "poner";
        pintarControles();
      }
      return;
  }
  cambio();
}

// Operaciones del sistema sobre la selección.
function bloque(sel) {
  const out = [];
  for (let y = 0; y < sel.h; y++) for (let x = 0; x < sel.w; x++) {
    const c = S.celdas[k(sel.x + x, sel.y + y)];
    out.push({ x, y, cel: c ? { ...c, c: { ...c.c } } : null });
  }
  return out;
}
function estampar(celdas, ox, oy, transformar = (c) => c) {
  celdas.forEach(({ x, y, cel }) => {
    const p = transformar({ x, y, cel });
    const X = ox + p.x, Y = oy + p.y;
    if (!dentro(X, Y)) return;
    if (p.cel) S.celdas[k(X, Y)] = p.cel; else delete S.celdas[k(X, Y)];
  });
}
const OPERACIONES = {
  repetir(sel) {
    const b = bloque(sel), F = fmt();
    for (let oy = sel.y - Math.ceil(sel.y / sel.h) * sel.h; oy < F.filas; oy += sel.h)
      for (let ox = sel.x - Math.ceil(sel.x / sel.w) * sel.w; ox < F.cols; ox += sel.w) estampar(b, ox, oy);
    return "Repetido en todo el lienzo.";
  },
  escalonar(sel) {
    const b = bloque(sel), F = fmt();
    let fila = 0;
    for (let oy = sel.y; oy < F.filas; oy += sel.h, fila++) {
      const corr = fila % sel.w;
      for (let ox = sel.x - sel.w * 2 + corr; ox < F.cols; ox += sel.w) estampar(b, ox, oy);
    }
    fila = -1;
    for (let oy = sel.y - sel.h; oy > -sel.h; oy -= sel.h, fila--) {
      const corr = ((fila % sel.w) + sel.w) % sel.w;
      for (let ox = sel.x - sel.w * 2 + corr; ox < F.cols; ox += sel.w) estampar(b, ox, oy);
    }
    return "Escalonado: cada fila corre una celda.";
  },
  derecha(sel) {
    estampar(bloque(sel), sel.x + sel.w, sel.y, ({ x, y, cel }) => ({ x: sel.w - 1 - x, y, cel: cel && { ...cel, ...reflejarH(cel) } }));
    S.sel = { ...sel, w: sel.w * 2 };
    return "Reflejado hacia la derecha.";
  },
  abajo(sel) {
    estampar(bloque(sel), sel.x, sel.y + sel.h, ({ x, y, cel }) => ({ x, y: sel.h - 1 - y, cel: cel && { ...cel, ...reflejarV(cel) } }));
    S.sel = { ...sel, h: sel.h * 2 };
    return "Reflejado hacia abajo.";
  },
  cuatro(sel) {
    OPERACIONES.derecha(sel);
    OPERACIONES.abajo(S.sel);
    return "Reflejado en cuatro: figura simétrica.";
  },
  girar(sel) {
    const b = bloque(sel);
    for (let y = 0; y < sel.h; y++) for (let x = 0; x < sel.w; x++) delete S.celdas[k(sel.x + x, sel.y + y)];
    estampar(b, sel.x, sel.y, ({ x, y, cel }) => ({ x: sel.h - 1 - y, y: x, cel: cel && { ...cel, ...girar(cel) } }));
    S.sel = { ...sel, w: sel.h, h: sel.w };
    return "Selección girada 90°.";
  },
  vaciar(sel) {
    for (let y = 0; y < sel.h; y++) for (let x = 0; x < sel.w; x++) delete S.celdas[k(sel.x + x, sel.y + y)];
    return "Selección vaciada.";
  },
  guardarFigura(sel) {
    const celdas = bloque(sel).filter((c) => c.cel).map(({ x, y, cel }) => ({ x, y, ...cel }));
    if (!celdas.length) return "La selección está vacía: no hay figura que guardar.";
    const id = "fig" + Date.now();
    misFiguras.push({ id, nombre: `Figura ${misFiguras.length + 1}`, w: sel.w, h: sel.h, celdas });
    const ok = guardar("geo:figuras", misFiguras);
    S.pincel = { tipo: "figura", id };
    S.pestana = "mias";
    S.herramienta = "poner";
    return ok ? "Figura guardada en «Mis figuras»." : "Figura guardada en «Mis figuras» (solo hasta recargar: este navegador no permite guardar).";
  },
};

// ---------- generar al azar ----------
function azar(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Una figura de 2 × 2 hecha con formas base, reflejada en cuatro y repetida: el quilt de X01.
function generar(seed = Date.now()) {
  const r = azar(seed), elegir = (l) => l[Math.floor(r() * l.length)];
  const pares = [["Lapislázuli", "Rosa"], ["Azul", "Celeste"], ["Morado", "Amarillo"], ["Negro", "Amarillo"], ["Verde", "Azul"], ["Rosa", "Lapislázuli"], ["Hueso", "Negro"], ["Celeste", "Azul"]];
  const [f, a] = elegir(pares);
  const resto = COLORES.filter((c) => c !== f && c !== a);
  const b = elegir(resto);
  const formas = FORMAS.filter((x) => x.id !== "vacia").map((x) => x.id);
  S.celdas = {};
  const lado = r() < 0.5 ? 2 : 3;
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
    const invertir = r() < 0.3;
    S.celdas[k(x, y)] = { f: elegir(formas), r: Math.floor(r() * 4), e: false, c: invertir ? { f: a, a: f, b } : { f, a, b } };
  }
  const sel = { x: 0, y: 0, w: lado, h: lado };
  OPERACIONES.cuatro(sel);
  OPERACIONES.repetir(S.sel);
  S.sel = null;
  S.pincel = { ...S.pincel, c: { f, a, b } };
  cambio();
  pintarControles();
}

// ---------- interfaz ----------
const $ = (id) => document.getElementById(id);
const lienzo = $("lienzo");
const ctx = lienzo.getContext("2d");

function dibujar() {
  const F = fmt();
  const W = F.cols * F.celda, H = F.filas * F.celda;
  if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
  $("marco").style.aspectRatio = `${W} / ${H}`;
  $("marco").style.width = `min(100%, calc(76vh * ${W / H}))`;
  pintar(ctx, 1, true);
  const usados = coloresUsados();
  $("info").textContent = `${F.cols} × ${F.filas} celdas de ${F.celda} px`;
  const r = $("regla");
  r.textContent = `${usados.length} de ${MAX_COLORES} colores`;
  r.className = "pill " + (usados.length > MAX_COLORES ? "warn" : "ok");
  r.title = usados.join(", ");
  $("aviso-colores").hidden = usados.length <= MAX_COLORES;
  $("aviso-colores").textContent = `Regla 3: hasta ${MAX_COLORES} colores por pieza (un fondo y tres de figura). Ahora hay ${usados.length}: ${usados.join(", ")}.`;
  lienzo.setAttribute("aria-label", `Mosaico ${F.nombre}, ${Object.keys(S.celdas).length} celdas pintadas`);
}
function cambio() { persistir(); dibujar(); }

function celdaDe(e) {
  const r = lienzo.getBoundingClientRect(), F = fmt();
  return { x: Math.floor(((e.clientX - r.left) / r.width) * F.cols), y: Math.floor(((e.clientY - r.top) / r.height) * F.filas) };
}
let arrastre = null, ultima = "";
lienzo.addEventListener("pointerdown", (e) => {
  const c = celdaDe(e);
  lienzo.setPointerCapture(e.pointerId);
  if (S.herramienta === "seleccionar") { arrastre = c; S.sel = { x: c.x, y: c.y, w: 1, h: 1 }; pintarOperaciones(); dibujar(); return; }
  arrastre = c;
  ultima = k(c.x, c.y);
  aplicar(c.x, c.y);
});
lienzo.addEventListener("pointermove", (e) => {
  const c = celdaDe(e);
  S.hover = e.pointerType === "touch" ? null : c;
  if (arrastre && S.herramienta === "seleccionar") {
    const F = fmt();
    const x0 = Math.max(0, Math.min(arrastre.x, c.x)), y0 = Math.max(0, Math.min(arrastre.y, c.y));
    const x1 = Math.min(F.cols - 1, Math.max(arrastre.x, c.x)), y1 = Math.min(F.filas - 1, Math.max(arrastre.y, c.y));
    S.sel = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    pintarOperaciones();
  } else if (arrastre && k(c.x, c.y) !== ultima && ["poner", "borrar"].includes(S.herramienta) && celdasDelPincel().w === 1) {
    ultima = k(c.x, c.y);
    aplicar(c.x, c.y);
    return;
  }
  dibujar();
});
const soltar = () => { arrastre = null; };
lienzo.addEventListener("pointerup", soltar);
lienzo.addEventListener("pointercancel", soltar);
lienzo.addEventListener("pointerleave", () => { S.hover = null; dibujar(); });
lienzo.addEventListener("keydown", (e) => {
  const F = fmt(), h = S.hover || { x: 0, y: 0 };
  const mov = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (mov) {
    e.preventDefault();
    S.hover = { x: Math.max(0, Math.min(F.cols - 1, h.x + mov[0])), y: Math.max(0, Math.min(F.filas - 1, h.y + mov[1])) };
    dibujar();
  } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aplicar(h.x, h.y); }
  else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); delete S.celdas[k(h.x, h.y)]; cambio(); }
  else if (e.key.toLowerCase() === "r" && S.pincel.tipo === "forma") { S.pincel = { ...S.pincel, ...girar(S.pincel) }; persistir(); pintarControles(); }
});
lienzo.addEventListener("focus", () => { if (!S.hover) { S.hover = { x: 0, y: 0 }; dibujar(); } });

// Miniaturas
function miniaturaCeldas(w, h, celdas, tam = 56) {
  const c = document.createElement("canvas");
  const lado = tam / Math.max(w, h);
  c.width = Math.round(w * lado);
  c.height = Math.round(h * lado);
  const x = c.getContext("2d");
  x.fillStyle = HEX.Hueso;
  x.fillRect(0, 0, c.width, c.height);
  celdas.forEach((cel) => pintarCelda(x, cel, cel.x * lado, cel.y * lado, lado));
  return c;
}
function botonPool(etiqueta, nota, canvas, activo, alElegir, extra) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "item";
  b.setAttribute("role", "radio");
  b.setAttribute("aria-checked", String(activo));
  b.setAttribute("aria-label", nota ? `${etiqueta}, ${nota}` : etiqueta);
  b.title = nota ? `${etiqueta} · ${nota}` : etiqueta;
  b.append(canvas);
  const s = document.createElement("span");
  s.textContent = etiqueta;
  b.append(s);
  b.addEventListener("click", alElegir);
  if (!extra) return b;
  const env = document.createElement("div");
  env.className = "item-envoltorio";
  env.append(b, extra);
  return env;
}
function pintarPool() {
  const cont = $("pool");
  cont.replaceChildren();
  const p = S.pincel;
  if (S.pestana === "base") {
    const c = p.tipo === "forma" ? p.c : { f: "Hueso", a: "Negro", b: "Rosa" };
    FORMAS.forEach((f) => {
      const cel = { x: 0, y: 0, f: f.id, r: p.tipo === "forma" ? p.r : 0, e: p.tipo === "forma" ? p.e : false, c };
      cont.append(botonPool(f.nombre, f.nota, miniaturaCeldas(1, 1, [cel]), p.tipo === "forma" && p.id === f.id, () => {
        S.pincel = p.tipo === "forma" ? { ...p, id: f.id } : { tipo: "forma", id: f.id, r: 0, e: false, c: { f: "Rosa", a: "Lapislázuli", b: "Amarillo" } };
        S.herramienta = "poner";
        persistir();
        pintarControles();
      }));
    });
  } else {
    if (!misFiguras.length) {
      const v = document.createElement("p");
      v.className = "nota vacio";
      v.textContent = "Aún no hay figuras. Arma una con las formas base, elige la herramienta Seleccionar, marca la figura y toca «Guardar como figura».";
      cont.append(v);
    }
    misFiguras.forEach((m) => {
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "quitar";
      quitar.textContent = "×";
      quitar.setAttribute("aria-label", "Quitar " + m.nombre);
      quitar.addEventListener("click", () => {
        misFiguras = misFiguras.filter((x) => x.id !== m.id);
        guardar("geo:figuras", misFiguras);
        if (p.tipo === "figura" && p.id === m.id) S.pincel = { tipo: "forma", id: "media", r: 0, e: false, c: { f: "Rosa", a: "Lapislázuli", b: "Amarillo" } };
        pintarControles();
      });
      cont.append(botonPool(`${m.nombre} · ${m.w}×${m.h}`, "", miniaturaCeldas(m.w, m.h, m.celdas), p.tipo === "figura" && p.id === m.id, () => {
        S.pincel = { tipo: "figura", id: m.id };
        S.herramienta = "poner";
        persistir();
        pintarControles();
      }, quitar));
    });
  }
}

function filaColores(titulo, actual, alElegir) {
  const fila = document.createElement("div");
  fila.className = "fila-color";
  const et = document.createElement("span");
  et.className = "etiqueta";
  et.textContent = `${titulo} · ${actual}`;
  const chips = document.createElement("div");
  chips.className = "chips";
  chips.setAttribute("role", "radiogroup");
  chips.setAttribute("aria-label", titulo);
  COLORES.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.style.setProperty("--c", HEX[c]);
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(actual === c));
    b.setAttribute("aria-label", c);
    b.title = c;
    b.addEventListener("click", () => alElegir(c));
    chips.append(b);
  });
  fila.append(et, chips);
  return fila;
}

function pintarPincel() {
  const p = S.pincel, cont = $("pincel");
  cont.replaceChildren();
  if (p.tipo === "figura") {
    const m = misFiguras.find((x) => x.id === p.id);
    const fila = document.createElement("div");
    fila.className = "pincel-fila";
    if (m) fila.append(miniaturaCeldas(m.w, m.h, m.celdas, 72));
    const t = document.createElement("p");
    t.className = "seleccion";
    t.textContent = m ? `${m.nombre} · ${m.w} × ${m.h} celdas. Se pone completa con sus colores.` : "Figura no encontrada.";
    fila.append(t);
    cont.append(fila);
    return;
  }
  const f = forma(p.id);
  const fila = document.createElement("div");
  fila.className = "pincel-fila";
  fila.append(miniaturaCeldas(1, 1, [{ x: 0, y: 0, f: p.id, r: p.r, e: p.e, c: p.c }], 72));
  const info = document.createElement("div");
  info.className = "pincel-info";
  info.innerHTML = `<strong></strong><span class="nota"></span>`;
  info.querySelector("strong").textContent = f.nombre;
  info.querySelector("span").textContent = `${f.nota} · giro ${p.r * 90}°${p.e ? " · reflejada" : ""}`;
  const acc = document.createElement("div");
  acc.className = "seg";
  const btn = (txt, fn, label) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.setAttribute("aria-label", label); b.addEventListener("click", fn); return b; };
  acc.append(
    btn("Girar 90°", () => { S.pincel = { ...p, ...girar(p) }; persistir(); pintarControles(); }, "Girar la forma 90 grados"),
    btn("Reflejar", () => { S.pincel = { ...p, ...reflejarH(p) }; persistir(); pintarControles(); }, "Reflejar la forma"),
    btn("Invertir colores", () => { S.pincel = { ...p, c: { ...p.c, f: p.c.a, a: p.c.f } }; persistir(); pintarControles(); }, "Intercambiar fondo y figura"),
  );
  info.append(acc);
  fila.append(info);
  cont.append(fila);
  const setColor = (ranura) => (c) => { S.pincel = { ...p, c: { ...p.c, [ranura]: c } }; persistir(); pintarControles(); };
  cont.append(filaColores("Fondo de la celda", p.c.f, setColor("f")));
  if (usaA(p.id)) cont.append(filaColores("Figura", p.c.a, setColor("a")));
  if (usaB(p.id)) cont.append(filaColores("Detalle", p.c.b, setColor("b")));
}

function pintarOperaciones() {
  const s = S.sel;
  $("operaciones").hidden = S.herramienta !== "seleccionar";
  $("sel-info").textContent = s ? `Selección: ${s.w} × ${s.h} celdas` : "Arrastra sobre el lienzo para marcar la figura.";
  document.querySelectorAll("[data-op]").forEach((b) => (b.disabled = !s));
}

function pintarControles() {
  document.querySelectorAll("[data-herramienta]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.herramienta === S.herramienta)));
  document.querySelectorAll("[data-pestana]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.pestana === S.pestana)));
  $("formato").value = S.formato;
  $("grilla").checked = S.grilla;
  pintarPool();
  pintarPincel();
  pintarOperaciones();
  dibujar();
}

document.querySelectorAll("[data-herramienta]").forEach((b) => b.addEventListener("click", () => {
  S.herramienta = b.dataset.herramienta;
  if (S.herramienta !== "seleccionar") S.sel = null;
  pintarControles();
}));
document.querySelectorAll("[data-pestana]").forEach((b) => b.addEventListener("click", () => { S.pestana = b.dataset.pestana; pintarControles(); }));
document.querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => {
  if (!S.sel) return;
  const msg = OPERACIONES[b.dataset.op](S.sel);
  $("estado").textContent = msg;
  cambio();
  pintarControles();
}));
$("formato").replaceChildren(...FORMATOS.map((f) => { const o = document.createElement("option"); o.value = f.id; o.textContent = f.nombre; return o; }));
$("formato").addEventListener("change", (e) => { S.formato = e.target.value; S.sel = null; cambio(); pintarControles(); });
$("grilla").addEventListener("change", (e) => { S.grilla = e.target.checked; dibujar(); });
$("generar").addEventListener("click", () => { generar(); $("estado").textContent = "Mosaico generado: una figura de formas base reflejada en cuatro y repetida."; });
$("vaciar").addEventListener("click", () => {
  const b = $("vaciar");
  if (b.dataset.confirmar) { delete b.dataset.confirmar; b.textContent = "Vaciar lienzo"; S.celdas = {}; S.sel = null; cambio(); return; }
  b.dataset.confirmar = "1";
  b.textContent = "¿Vaciar todo? Toca de nuevo";
  setTimeout(() => { delete b.dataset.confirmar; b.textContent = "Vaciar lienzo"; }, 3000);
});

// ---------- exportar ----------
async function guardarArchivo(nombre, blob) {
  try {
    const d = window.claude?.use ? await window.claude.use("downloads") : null;
    if (d) { await d.save({ filename: nombre, data: blob }); return "guardado"; }
  } catch (e) {
    if (e?.code === "declined") return "cancelado";
    if (e?.code === "rate_limited") return "ocupado";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "guardado";
}
const informar = (r, que) => { $("estado").textContent = r === "cancelado" ? "Descarga cancelada." : r === "ocupado" ? "Ya hay una descarga pendiente." : `${que} descargado.`; };

$("png").addEventListener("click", async () => {
  const F = fmt(), c = document.createElement("canvas");
  c.width = F.cols * F.celda;
  c.height = F.filas * F.celda;
  pintar(c.getContext("2d"), 1, false);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  informar(await guardarArchivo(`geometrica-${F.id}-${c.width}x${c.height}.png`, blob), "PNG");
});

// SVG con los grupos Fondo y Figura, como los componentes del archivo. Cada color lleva su nombre de Línea azul.
function construirSVG() {
  const F = fmt(), t = F.celda, W = F.cols * t, H = F.filas * t;
  const fondos = [`<rect width="${W}" height="${H}" fill="${HEX.Hueso}" data-color="Hueso"/>`];
  const figuras = [];
  for (const [clave, cel] of Object.entries(S.celdas)) {
    const [x, y] = clave.split(",").map(Number);
    if (!dentro(x, y)) continue;
    fondos.push(`<rect x="${x * t}" y="${y * t}" width="${t}" height="${t}" fill="${HEX[cel.c.f]}" data-color="${cel.c.f}"/>`);
    const capas = forma(cel.f).capas;
    if (!capas.length) continue;
    const tr = `translate(${x * t} ${y * t}) scale(${t / U}) translate(6 6) rotate(${cel.r * 90})${cel.e ? " scale(-1 1)" : ""} translate(-6 -6)`;
    figuras.push(`<g transform="${tr}">${capas.map(([d, r]) => `<path d="${d}" fill="${HEX[cel.c[r]]}" fill-rule="evenodd" data-color="${cel.c[r]}"/>`).join("")}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<g id="Fondo">\n${fondos.join("\n")}\n</g>\n<g id="Figura">\n${figuras.join("\n")}\n</g>\n</svg>\n`;
}
$("svg").addEventListener("click", async () => {
  const F = fmt();
  informar(await guardarArchivo(`geometrica-${F.id}.svg`, new Blob([construirSVG()], { type: "image/svg+xml" })), "SVG");
});
$("copiar").addEventListener("click", () => {
  const svg = construirSVG();
  const respaldo = () => { $("svg-texto").hidden = false; $("svg-texto").value = svg; $("svg-texto").select(); $("estado").textContent = "Copia el SVG del recuadro y pégalo en Figma."; };
  try { navigator.clipboard.writeText(svg).then(() => { $("estado").textContent = "SVG copiado. Pégalo en Figma con Ctrl/Cmd+V."; }).catch(respaldo); } catch { respaldo(); }
});

if (!guardado) generar(20261103);
pintarControles();
