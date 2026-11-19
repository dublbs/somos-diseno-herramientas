import { useEffect, useState } from 'react';

// «Agregar a inicio»: instalar la credencial como app en el celular.
// Android/Chrome avisa con `beforeinstallprompt` y se instala con un toque. iPhone no tiene esa función:
// se muestran los pasos (Compartir → Agregar a inicio). Ya instalada, el botón no aparece.

interface AvisoInstalar extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let aviso: AvisoInstalar | null = null;
const oyentes = new Set<() => void>();
// Se escucha desde que carga la app (main.tsx importa este archivo): el evento llega una sola vez y temprano.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); aviso = e as AvisoInstalar; oyentes.forEach(f => f()); });
  window.addEventListener('appinstalled', () => { aviso = null; oyentes.forEach(f => f()); });
}

export const instalada = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
export const esIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export type ModoInstalar = 'instalada' | 'directo' | 'iphone' | 'menu';

export function useInstalar() {
  const calcular = (): ModoInstalar => instalada() ? 'instalada' : aviso ? 'directo' : esIphone() ? 'iphone' : 'menu';
  const [modo, setModo] = useState<ModoInstalar>(calcular);
  useEffect(() => { const f = () => setModo(calcular()); oyentes.add(f); return () => { oyentes.delete(f); }; }, []);
  // Devuelve true si se instaló con el aviso del navegador; false si hay que mostrar los pasos.
  const instalar = async (): Promise<boolean> => {
    if (!aviso) return false;
    await aviso.prompt();
    const { outcome } = await aviso.userChoice;
    aviso = null; setModo(calcular());
    return outcome === 'accepted';
  };
  return { modo, instalar };
}
