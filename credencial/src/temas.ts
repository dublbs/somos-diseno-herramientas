import type { Visual } from '../../shared/marcos';

// MVP: 2 marcos por lenguaje (M02 y M05). Cada marco es un tema completo de la interfaz:
// banda (cabecera y fondo), patrón de Figma detrás, acento de los botones, personaje y timbres del lenguaje.
// Los SVG vienen de Figma (ver docs/plans/003-credencial/assets.manifest.md). Las rutas son literales
// para que scripts/artifact.mjs pueda incrustarlas en la vista previa de claude.ai.

export type IdPersonaje = 'pixel' | 'geometrica' | 'organica';
export interface Personaje { id: IdPersonaje; nombre: string; visual: Visual; src: string }
export interface Timbre { nombre: string; src: string }
export interface Tema {
  marco: string;
  visual: Visual;
  banda: string; // color de la cabecera y del fondo de la página
  tinta: string; // texto sobre la banda
  acento: string; // botón principal
  sobreAcento: string; // texto sobre el acento
  patron: string;
  tamPatron?: number; // px del módulo del patrón en el fondo (96 por defecto)
  velo?: number; // 0..1 cuánto tapa la banda al patrón (0.62 por defecto)
}

export const PERSONAJES: Personaje[] = [
  { id: 'pixel', nombre: 'Invasor', visual: 'Pixel', src: './figma/personaje-pixel.svg' },
  { id: 'geometrica', nombre: 'Glifo', visual: 'Geométrica', src: './figma/personaje-geometrica.svg' },
  { id: 'organica', nombre: 'Pingüino', visual: 'Orgánica', src: './figma/personaje-organica.svg' },
];
export const personajeDe = (id: string | undefined) => PERSONAJES.find(p => p.id === id) || PERSONAJES[0];

// 4 timbres predeterminados por lenguaje: las estaciones 1–4 son las mismas para todos.
export const TIMBRES: Record<Visual, Timbre[]> = {
  Pixel: [
    { nombre: 'Metro', src: './figma/timbre-pixel-1.svg' },
    { nombre: 'Vinilo', src: './figma/timbre-pixel-2.svg' },
    { nombre: 'Spray', src: './figma/timbre-pixel-3.svg' },
    { nombre: 'Ecualizador', src: './figma/timbre-pixel-4.svg' },
  ],
  Geométrica: [
    { nombre: 'Polar', src: './figma/timbre-geometrica-1.svg' },
    { nombre: 'Túnel', src: './figma/timbre-geometrica-2.svg' },
    { nombre: 'Damero', src: './figma/timbre-geometrica-3.svg' },
    { nombre: 'Cruz escalonada', src: './figma/timbre-geometrica-4.svg' },
  ],
  Orgánica: [
    { nombre: 'Sol', src: './figma/timbre-organica-1.svg' },
    { nombre: 'Pudú', src: './figma/timbre-organica-2.svg' },
    { nombre: 'Paloma', src: './figma/timbre-organica-3.svg' },
    { nombre: 'Helecho', src: './figma/timbre-organica-4.svg' },
  ],
};

const HUESO = '#F4EEE3', NEGRO = '#000000';
export const TEMAS: Tema[] = [
  { marco: 'PM02', visual: 'Pixel', banda: '#7A2E8E', tinta: HUESO, acento: '#FF8FB1', sobreAcento: NEGRO, patron: './figma/patron-pixel-surcos.svg', tamPatron: 72 },
  { marco: 'PM05', visual: 'Pixel', banda: NEGRO, tinta: HUESO, acento: '#FFC20E', sobreAcento: NEGRO, patron: './figma/patron-pixel-lateral.svg', tamPatron: 72 },
  { marco: 'GM02', visual: 'Geométrica', banda: '#7A2E8E', tinta: HUESO, acento: '#FFC20E', sobreAcento: NEGRO, patron: './figma/patron-geo-allqa.svg', tamPatron: 44, velo: 0.78 },
  { marco: 'GM05', visual: 'Geométrica', banda: NEGRO, tinta: HUESO, acento: '#00A651', sobreAcento: NEGRO, patron: './figma/patron-geo-damero.svg' },
  { marco: 'OM02', visual: 'Orgánica', banda: '#0062B8', tinta: HUESO, acento: '#FFC20E', sobreAcento: NEGRO, patron: './figma/patron-org-mediosol.svg', tamPatron: 56, velo: 0.72 },
  { marco: 'OM05', visual: 'Orgánica', banda: '#FF8FB1', tinta: NEGRO, acento: '#0062B8', sobreAcento: HUESO, patron: './figma/patron-org-anillos.svg' },
];
export const MARCO_INICIAL = 'PM05';
export const temaDe = (marco: string | undefined) => TEMAS.find(t => t.marco === marco) || TEMAS.find(t => t.marco === MARCO_INICIAL)!;
