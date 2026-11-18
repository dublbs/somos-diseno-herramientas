// Lo que le falta al navegador de la Samsung Flip 2 (Tizen 5.0, Chromium ~69). Se carga antes que todo.
if (!Object.fromEntries) {
  Object.fromEntries = <T = unknown>(pares: Iterable<readonly [PropertyKey, T]>) => {
    const o: Record<PropertyKey, T> = {};
    for (const [k, v] of pares) o[k] = v;
    return o;
  };
}
if (!Array.prototype.flat) {
  Object.defineProperty(Array.prototype, 'flat', { configurable: true, writable: true, value(this: unknown[], d = 1): unknown[] {
    return d < 1 ? this.slice() : this.reduce<unknown[]>((a, x) => a.concat(Array.isArray(x) ? (x as unknown[]).flat(d - 1) : x), []);
  } });
}
if (!String.prototype.replaceAll) {
  Object.defineProperty(String.prototype, 'replaceAll', { configurable: true, writable: true, value(this: string, a: string | RegExp, b: string) {
    return typeof a === 'string' ? this.split(a).join(b) : this.replace(a, b);
  } });
}
// `window` y no `globalThis`: globalThis llegó en Chromium 71 y aquí cortaría la carga.
if (typeof window.queueMicrotask !== 'function') window.queueMicrotask =(f: () => void) => { Promise.resolve().then(f); };
// ctx.roundRect llegó en Chromium 99: sin él, el tren y los carteles de nombre cortan cada cuadro de la escena.
type Radios = number | DOMPointInit | (number | DOMPointInit)[];
const proto = CanvasRenderingContext2D.prototype as unknown as { roundRect?: unknown };
if (typeof proto.roundRect !== 'function') {
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'roundRect', { configurable: true, writable: true, value(this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Radios = 0) {
    const l = (Array.isArray(r) ? r : [r]).map(v => (typeof v === 'number' ? v : (v.x || 0)));
    // 1 → todas · 2 → (sup-izq e inf-der, sup-der e inf-izq) · 3 → (sup-izq, sup-der e inf-izq, inf-der) · 4 → en orden
    const [a, b, c, d] = l.length >= 4 ? l : l.length === 3 ? [l[0], l[1], l[2], l[1]] : l.length === 2 ? [l[0], l[1], l[0], l[1]] : [l[0], l[0], l[0], l[0]];
    const m = Math.min(Math.abs(w), Math.abs(h)) / 2, k = (v: number) => Math.max(0, Math.min(v, m));
    const [tl, tr, br, bl] = [k(a), k(b), k(c), k(d)];
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y); this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br); this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h); this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl); this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
  } });
}
export {};
