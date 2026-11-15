// Graffiti y Tags · configuración. Assets: docs/plans/002-graffiti/assets.manifest.md
// Plan 009 §3: la pared es horizontal (2:1) y con más resolución, para que cada pincel deje una marca propia.
export const COLS = 160;
export const FILAS = 80;

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

// Tamaños de cada pincel, en celdas (como el tamaño del pincel en Photoshop): spray y borrador (radio),
// plumón (radio del trazo) y rodillo (medio ancho de la franja).
export type Tamano = 0 | 1 | 2;
export const TAMANOS: { nombre: string; spray: number; plumon: number; rodillo: number }[] = [
  { nombre: 'Fino', spray: 3, plumon: 1, rodillo: 6 },
  { nombre: 'Medio', spray: 5, plumon: 2, rodillo: 10 },
  { nombre: 'Grueso', spray: 8, plumon: 4, rodillo: 15 },
];

// Plan 009 §3: se quedan ladrillo y hormigón; entran la cortina metálica de la libreta (Figma) y el vagón de metro.
export interface Muro { id: string; nombre: string; src: string }
export const MUROS: Muro[] = [
  { id: 'ladrillo', nombre: 'Ladrillo', src: A('muros/ladrillo') },
  { id: 'hormigon', nombre: 'Hormigón', src: A('muros/hormigon') },
  { id: 'cortina', nombre: 'Cortina metálica', src: A('muros/cortina') },
  { id: 'vagon', nombre: 'Vagón de metro', src: A('muros/vagon') },
];

// Tamaño en celdas al estamparlo (ancho; el alto sale de la proporción del SVG).
export interface Sticker { id: string; nombre: string; src: string; ancho: number }
export const STICKERS: Sticker[] = [
  { id: 'spray', nombre: 'Spray', src: A('stickers/spray'), ancho: 28 },
  { id: 'rodillo', nombre: 'Rodillo', src: A('stickers/rodillo'), ancho: 28 },
  { id: 'tarro', nombre: 'Tarro', src: A('stickers/tarro-pintura'), ancho: 28 },
  { id: 'senal', nombre: 'Señal', src: A('stickers/senal-rodillo'), ancho: 28 },
  { id: 'plumon', nombre: 'Plumón', src: A('stickers/plumon'), ancho: 28 },
  { id: 'personaje', nombre: 'Personaje', src: A('stickers/personaje'), ancho: 28 },
  { id: 'tag', nombre: 'Tag', src: A('tag/tag-ejemplo'), ancho: 56 },
];

export const MAX_CHORROS = 70;
// Goteo por carga: cada pasada del spray suma pintura a la celda y la pintura se seca sola (SECADO por segundo).
// Donde la carga pasa el umbral nace un chorro: el spray quieto chorrea, el trazo lento a veces, el rápido casi no.
// Plan 009: «poco» es el de entrada; «mucho» se mantiene, más contenido que antes.
export type NivelGoteo = 'nada' | 'poco' | 'mucho';
export const GOTEO: Record<Exclude<NivelGoteo, 'nada'>, { umbral: number; largo: [number, number]; cada: number; anchoDoble: number }> = {
  poco: { umbral: 9, largo: [8, 18], cada: 700, anchoDoble: 0 },
  mucho: { umbral: 6, largo: [14, 34], cada: 280, anchoDoble: 0.5 }, // anchoDoble: probabilidad de chorro de 2 celdas (boquilla gruesa)
};
export const SECADO = 0.6; // la carga que queda después de 1 s
export const PASO_CHORRO_MS: [number, number] = [70, 150]; // el chorro baja rápido al empezar y frena al final (celdas más chicas: más rápido)
export const SPRAY_CONTINUO_MS = 60; // el spray sigue soltando pintura aunque el dedo no se mueva
export const MAX_HISTORIAL = 40;
