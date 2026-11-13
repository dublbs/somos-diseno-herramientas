// Los afiches de la cacería (plan 008 §2): tentativos, desde Figma «Evento · Imprenta» › sección «afiches».
// Las miniaturas y su origen están en docs/plans/008-caceria/assets.manifest.md. El id es público (va en `pasos`);
// el secreto que codifica cada sello vive solo en la base.
import type { Visual } from '../../../shared/marcos';

export interface Afiche { id: string; nombre: string; lenguaje: Visual; img: string }
export const AFICHES: Afiche[] = [
  { id: 'AF01', nombre: 'Tejido', lenguaje: 'Geométrica', img: './figma/afiches/af01.webp' },
  { id: 'AF02', nombre: 'Ven a ver', lenguaje: 'Geométrica', img: './figma/afiches/af02.webp' },
  { id: 'AF03', nombre: 'Sol', lenguaje: 'Orgánica', img: './figma/afiches/af03.webp' },
  { id: 'AF04', nombre: 'Ven a crear', lenguaje: 'Orgánica', img: './figma/afiches/af04.webp' },
  { id: 'AF05', nombre: 'Metro', lenguaje: 'Pixel', img: './figma/afiches/af05.webp' },
  { id: 'AF06', nombre: 'Ven a jugar', lenguaje: 'Pixel', img: './figma/afiches/af06.webp' },
];
export const aficheDe = (id: string) => AFICHES.find(a => a.id === id);
export const nombreAfiche = (id: string) => aficheDe(id)?.nombre ?? `Afiche ${id}`;
