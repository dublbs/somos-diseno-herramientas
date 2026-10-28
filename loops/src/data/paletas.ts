export const HEX = {
  Hueso: '#F4EEE3',
  Blanco: '#FFFFFF',
  Negro: '#000000',
  Azul: '#0062B8',
  'Lapislázuli': '#2B4BD8',
  Celeste: '#7FC8F8',
  Amarillo: '#FFC20E',
  Verde: '#00A651',
  Rosa: '#FF8FB1',
  Morado: '#7A2E8E',
};

export type VisualModo = 'pixel' | 'geometrica' | 'organica';

export interface ModoConfig {
  id: VisualModo;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  badge: string;
  colorAcento: string;
}

export const MODOS: ModoConfig[] = [
  {
    id: 'pixel',
    nombre: 'Nivel de Juego',
    subtitulo: 'Día Pixel · Mesa 4',
    descripcion:
      'Un escenario lateral en bucle infinito con plataformas retro, parallax scrolling, monedas que giran y personajes que saltan.',
    badge: '8-Bit Loop',
    colorAcento: HEX.Morado,
  },
  {
    id: 'geometrica',
    nombre: 'Caleidoscopio',
    subtitulo: 'Día Geométrica · Mesa 4',
    descripcion:
      'Composiciones de simetría radial dinámica (4x y 8x) con transformaciones matemáticas: damero, zigzag, acordeón y grecas.',
    badge: 'Simetría Radial',
    colorAcento: HEX.Azul,
  },
  {
    id: 'organica',
    nombre: 'Teatro de Papel',
    subtitulo: 'Día Orgánica · Mesa 4',
    descripcion:
      'Marionetas botánicas y personajes de papel recortado con articulaciones elásticas, helechos que se enrollan y flores que respiran.',
    badge: 'Stop-Motion Cutout',
    colorAcento: HEX.Verde,
  },
];
