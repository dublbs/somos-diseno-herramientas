export interface Tinta {
  label: string;
  papel: string;
  modo: 'cmyk' | 'duo' | 'mono';
  c?: string; m?: string; y?: string; k?: string;
  a?: string; b?: string;
  // 'multiply' (por defecto): tintas translúcidas que se mezclan al superponerse (imprenta real).
  // 'opaca': cada punto tapa lo de abajo; los colores de la paleta se ven puros, sin mezclas sucias.
  mezcla?: 'multiply' | 'opaca';
  // Pixel · CRT: pinta la foto a todo color (posterizada) en vez de mapearla a la paleta.
  colorReal?: boolean;
}

// modo cmyk: 4 tintas · duo: sombras (a) + medios (b) · mono: una tinta.
export const TINTAS: Record<string, Tinta> = {
  cmyk:   { label:'CMYK', papel:'#F7F2E8', modo:'cmyk', c:'#00A3E0', m:'#E6007E', y:'#FFE600', k:'#1D1D1B', colorReal:true },
  azul:   { label:'Línea azul', papel:'#F4EEE3', modo:'cmyk', c:'#7FC8F8', m:'#FF8FB1', y:'#FFC20E', k:'#0062B8', mezcla:'opaca' },
  lapis:  { label:'Lapislázuli', papel:'#F4EEE3', modo:'cmyk', c:'#2B4BD8', m:'#FF8FB1', y:'#FFC20E', k:'#7A2E8E', mezcla:'opaca' },
  azrosa: { label:'Azul + rosa', papel:'#F4EEE3', modo:'duo', a:'#0062B8', b:'#FF8FB1' },
  moverde:{ label:'Morado + verde', papel:'#F4EEE3', modo:'duo', a:'#7A2E8E', b:'#00A651' },
  negro:  { label:'Solo negro', papel:'#F4EEE3', modo:'mono', a:'#141414' },
};

export const coloresTinta = (t: Tinta): string[] =>
  t.modo === 'cmyk' ? [t.c!, t.m!, t.y!, t.k!] : t.modo === 'duo' ? [t.a!, t.b!] : [t.a!];
