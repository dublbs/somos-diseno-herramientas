import { FONDO, FONDO_BOSQUE, FONDO_DESIERTO, FONDO_MAR, type Capa } from './piezas';

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

// Elenco estandarizado (plan 004): cada escenario tiene su astro, su ave, su animal, su planta emblema, su planta chica,
// su fruto o hallazgo y su artesanía. Donde hay dos opciones (Chagual/Cochayuyo, Carpintero/Chucao, Luna/Lluvia)
// van las dos para compararlas. Las piezas nuevas son bocetos (scripts/generar-bocetos.py).
export const ESCENARIOS: Escenario[] = [
  {
    id: 'cordillera', nombre: 'Cordillera', detalle: 'Montañas y cielo',
    fondo: FONDO,
    piezas: { sol: 'cielo', condor: 'cielo', huemul: 'suelo', araucaria: 'suelo', helecho: 'suelo', pina: 'suelo', kisa: 'suelo' },
  },
  {
    id: 'mar', nombre: 'Mar', detalle: 'Olas y costa',
    fondo: FONDO_MAR,
    piezas: { sol: 'cielo', gaviota: 'cielo', pinguino: 'suelo', pez: 'agua', cochayuyo: 'agua', chagual: 'suelo', doca: 'suelo', concha: 'suelo', canasto: 'suelo' },
  },
  {
    id: 'desierto', nombre: 'Desierto', detalle: 'Dunas y quiscos',
    fondo: FONDO_DESIERTO,
    piezas: { sol: 'cielo', picaflor: 'cielo', guanaco: 'suelo', quisco: 'suelo', flor: 'suelo', chanar: 'suelo', cantaro: 'suelo' },
  },
  {
    id: 'bosque', nombre: 'Bosque', detalle: 'Lluvia y alerces',
    fondo: FONDO_BOSQUE,
    piezas: { luna: 'cielo', lluvia: 'cielo', carpintero: 'cielo', copihue: 'cielo', pudu: 'suelo', chucao: 'suelo', alerce: 'suelo', maqui: 'suelo', telar: 'suelo' },
  },
];
export const escenario = (id: string) => ESCENARIOS.find(e => e.id === id)!;
