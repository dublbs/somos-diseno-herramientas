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
if (!globalThis.queueMicrotask) globalThis.queueMicrotask = (f: () => void) => { Promise.resolve().then(f); };
export {};
