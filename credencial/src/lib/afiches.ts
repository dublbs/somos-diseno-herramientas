// Los afiches de la cacería (plan 010 §2): los 5 afiches A3 de Figma «Evento · Imprenta» › sección «afiches»
// (1044:12794), versión del 18 nov. Tejido (AF01) salió; el pingüino (03B) reemplaza al Sol en AF03.
// Las miniaturas y su origen están en docs/plans/010-caceria/assets.manifest.md. El id es público (va en `pasos`);
// el secreto que codifica cada sello vive solo en la base.
import type { Visual } from '../../../shared/marcos';

export interface Afiche { id: string; nombre: string; lenguaje: Visual; img: string }
export const AFICHES: Afiche[] = [
  { id: 'AF02', nombre: 'Ven a ver', lenguaje: 'Geométrica', img: './figma/afiches/af02.webp' },
  { id: 'AF03', nombre: 'Diseño con raíces', lenguaje: 'Orgánica', img: './figma/afiches/af03.webp' },
  { id: 'AF04', nombre: 'Ven a crear', lenguaje: 'Orgánica', img: './figma/afiches/af04.webp' },
  { id: 'AF05', nombre: 'Metro', lenguaje: 'Pixel', img: './figma/afiches/af05.webp' },
  { id: 'AF06', nombre: 'Ven a jugar', lenguaje: 'Pixel', img: './figma/afiches/af06.webp' },
];
export const aficheDe = (id: string) => AFICHES.find(a => a.id === id);
export const nombreAfiche = (id: string) => aficheDe(id)?.nombre ?? (id === 'SECRETO' ? 'Flyer' : `Afiche ${id}`);
