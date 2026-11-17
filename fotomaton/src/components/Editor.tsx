import { TINTAS } from '../data/tintas';
import type { Cara } from '../lib/cara';
import { componer } from '../lib/trama';
import { textoCara } from '../lib/estadoCara';
import { Lienzo } from './Lienzo';
import { Disparador } from './Disparador';
import type { ReactNode } from 'react';
import { BarraSuperior, BotonAccion, PantallaHerramienta } from '../../../shared/ui/Kit';

export interface FotoEditable { c: HTMLCanvasElement; cara: Cara | null; afinada?: boolean }

interface Props {
  foto: FotoEditable | null; marco: string; celda: number; tinta: string; apagadas: readonly string[];
  revelando: boolean; cambiando: boolean; textoCambio: string;
  ocupado: boolean; alLlevatela: () => void; alOtra: () => void;
  volver: string; acciones: ReactNode; lateral: ReactNode;
}

export function Editor({ foto, marco, celda, tinta, apagadas, revelando, cambiando, textoCambio, ocupado, alLlevatela, alOtra, volver, acciones, lateral }: Props) {
  const bloqueado = ocupado || revelando || cambiando || !foto;
  return (
    <PantallaHerramienta
      anchoLateral={320}
      superior={
        <BarraSuperior titulo="Fotomatón" volver={volver}
          bajada={`${foto && !revelando ? textoCara(foto.cara) + ' · ' : ''}Se guarda en 1080 × 1350, listo para historias y feed`}>
          {acciones}
          <BotonAccion icono="ios_share" texto={ocupado ? 'Preparando…' : 'Llévatela'} primario onClick={alLlevatela} disabled={bloqueado} />
        </BarraSuperior>
      }
      lateral={lateral}
      inferior={<Disparador texto="Otra foto" etiqueta="Sacar otra foto" onClick={alOtra} disabled={ocupado} />}
    >
      <div className="escenario-fit">
      <Lienzo className="lienzo-fit" deps={[marco, celda, tinta, foto, apagadas]} dibujar={(ctx, s) => { if (foto) componer(ctx, s, marco, foto.c, celda, TINTAS[tinta], foto.cara, { apagadas }); }}>
        {revelando || !foto ? <div className="carga"><span>Revelando tu trama…</span></div>
          : cambiando ? <div className="carga"><span>{textoCambio}</span></div> : null}
      </Lienzo>
      </div>
    </PantallaHerramienta>
  );
}
