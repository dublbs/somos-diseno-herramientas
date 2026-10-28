import { useEffect, useState } from 'react';

// Retardo al cambiar de marco: muestra una transición y recién después cambia.
export function useRetardo<T>(valor: T, ms: number): [T, boolean] {
  const [mostrado, setMostrado] = useState(valor), [cambiando, setCambiando] = useState(false);
  useEffect(() => {
    if (valor === mostrado) { setCambiando(false); return; }
    setCambiando(true);
    const t = setTimeout(() => { setMostrado(valor); setCambiando(false); }, ms);
    return () => clearTimeout(t);
  }, [valor]);
  return [mostrado, cambiando];
}
