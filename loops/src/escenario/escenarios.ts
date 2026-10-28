import { FONDO, FONDO_DESIERTO, FONDO_MAR, type Capa } from './piezas';

// Cada escenario tiene su fondo fijo y las piezas que hacen sentido ahí.
// `zona` dice dónde vive cada pieza para «Sorpréndeme»: cielo, suelo o agua.
export type Zona = 'cielo' | 'suelo' | 'agua';

export interface Escenario {
  id: string;
  nombre: string;
  detalle: string;
  fondo: { dur: number; capas: Capa[] };
  piezas: Record<string, Zona>;
}

export const ESCENARIOS: Escenario[] = [
  {
    id: 'cordillera', nombre: 'Cordillera', detalle: 'Montañas y cielo',
    fondo: FONDO,
    piezas: { sol: 'cielo', paloma: 'cielo', pudu: 'suelo', araucaria: 'suelo', pina: 'suelo', helecho: 'suelo', flor: 'suelo' },
  },
  {
    id: 'mar', nombre: 'Mar', detalle: 'Olas y playa',
    fondo: FONDO_MAR,
    piezas: { sol: 'cielo', paloma: 'cielo', pez: 'agua', pinguino: 'suelo', cantaro: 'suelo', canasto: 'suelo', kisa: 'suelo' },
  },
  {
    id: 'desierto', nombre: 'Desierto', detalle: 'Dunas y quiscos',
    fondo: FONDO_DESIERTO,
    piezas: { sol: 'cielo', paloma: 'cielo', pudu: 'suelo', quisco: 'suelo', canasto: 'suelo', cantaro: 'suelo', flor: 'suelo', kisa: 'suelo' },
  },
];
export const escenario = (id: string) => ESCENARIOS.find(e => e.id === id)!;
