import type { Cara } from './cara';

// El estado de la cara va en texto bajo la foto (nunca encima).
export const textoCara = (c: Cara | null, vivo = false) =>
  !c ? (vivo ? 'Mira a la cámara para centrar tu cara' : 'No encontramos una cara: la foto va al centro')
    : c.n > 1 ? `Grupo de ${c.n} personas ✓` : 'Cara centrada ✓';
