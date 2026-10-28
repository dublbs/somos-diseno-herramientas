// Graffiti y Tags · configuración. Assets: docs/plans/002-graffiti/assets.manifest.md
export const COLS = 60;
export const FILAS = 60;
export const CELDA_TARJETA = 18; // 60 × 18 = 1080 px en la tarjeta

const A = (ruta: string) => `${import.meta.env.BASE_URL}figma/${ruta}.svg`;

export interface Color { id: string; nombre: string; hex: string }
// Índice 0 = sin pintura (se ve el muro); la pintura guarda índice + 1.
export const PALETA: Color[] = [
  { id: 'lapislazuli', nombre: 'Lapislázuli', hex: '#2B4BD8' },
  { id: 'rosa', nombre: 'Rosa', hex: '#FF8FB1' },
  { id: 'amarillo', nombre: 'Amarillo', hex: '#FFC20E' },
  { id: 'verde', nombre: 'Verde', hex: '#00A651' },
  { id: 'celeste', nombre: 'Celeste', hex: '#7FC8F8' },
  { id: 'morado', nombre: 'Morado', hex: '#7A2E8E' },
  { id: 'negro', nombre: 'Negro', hex: '#000000' },
  { id: 'hueso', nombre: 'Hueso', hex: '#F4EEE3' },
];

export const BOQUILLAS = [
  { radio: 1, nombre: 'Fina' },
  { radio: 2, nombre: 'Media' },
  { radio: 3, nombre: 'Gruesa' },
];

export interface Muro { id: string; nombre: string; src: string }
export const MUROS: Muro[] = [
  { id: 'ladrillo', nombre: 'Ladrillo', src: A('muros/ladrillo') },
  { id: 'hormigon', nombre: 'Hormigón', src: A('muros/hormigon') },
  { id: 'persiana', nombre: 'Persiana', src: A('muros/persiana') },
  { id: 'damero', nombre: 'Damero', src: A('muros/damero') },
];

// Tamaño en celdas al estamparlo (ancho; el alto sale de la proporción del SVG).
export interface Sticker { id: string; nombre: string; src: string; ancho: number }
export const STICKERS: Sticker[] = [
  { id: 'spray', nombre: 'Spray', src: A('stickers/spray'), ancho: 18 },
  { id: 'rodillo', nombre: 'Rodillo', src: A('stickers/rodillo'), ancho: 18 },
  { id: 'tarro', nombre: 'Tarro', src: A('stickers/tarro-pintura'), ancho: 18 },
  { id: 'senal', nombre: 'Señal', src: A('stickers/senal-rodillo'), ancho: 18 },
  { id: 'plumon', nombre: 'Plumón', src: A('stickers/plumon'), ancho: 18 },
  { id: 'zapatilla', nombre: 'Zapatilla', src: A('stickers/zapatilla'), ancho: 18 },
  { id: 'cruce', nombre: 'Cruce', src: A('stickers/cruce-peatonal'), ancho: 18 },
  { id: 'personaje', nombre: 'Personaje', src: A('stickers/personaje'), ancho: 18 },
  { id: 'tag', nombre: 'Tag', src: A('tag/tag-ejemplo'), ancho: 30 },
];

export const MAX_CHORROS = 40;
export const PASO_CHORRO_MS = 70;
export const MAX_HISTORIAL = 40;
