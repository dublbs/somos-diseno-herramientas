import { TINTAS } from '../data/tintas';
import type { Cara } from '../lib/cara';
import { componer } from '../lib/trama';
import { textoCara } from '../lib/estadoCara';
import { Lienzo } from './Lienzo';
import type { ReactNode } from 'react';
import { BarraSuperior, BotonAccion, PantallaHerramienta } from '../../../shared/ui/Kit';

export interface FotoEditable { c: HTMLCanvasElement; cara: Cara | null; afinada?: boolean }

interface Props {
  foto: FotoEditable | null; marco: string; celda: number; tinta: string;
  revelando: boolean; cambiando: boolean; textoCambio: string;
  ocupado: boolean; alGuardar: () => void; alLlevatela: () => void; alOtra: () => void;
  volver: string; acciones: ReactNode; lateral: ReactNode; carrete: ReactNode;
}

export function Editor({ foto, marco, celda, tinta, revelando, cambiando, textoCambio, ocupado, alGuardar, alLlevatela, alOtra, volver, acciones, lateral, carrete }: Props) {
  const bloqueado = ocupado || revelando || cambiando || !foto;
  return (
    <PantallaHerramienta
      anchoLateral={300}
      superior={
        <BarraSuperior titulo="Fotomatón" volver={volver}
          bajada={`${foto && !revelando ? textoCara(foto.cara) + ' · ' : ''}Se guarda en 1080 × 1350, listo para historias y feed`}>
          {acciones}
          <BotonAccion icono="photo_camera" texto="Otra foto" onClick={alOtra} />
          <BotonAccion icono="download" texto="Guardar" etiqueta="Guardar imagen" onClick={alGuardar} disabled={bloqueado} />
          <BotonAccion icono="ios_share" texto={ocupado ? 'Preparando…' : 'Llévatela'} primario onClick={alLlevatela} disabled={bloqueado} />
        </BarraSuperior>
      }
      lateral={lateral}
      inferior={carrete}
    >
      <div className="escenario-fit">
      <Lienzo className="lienzo-fit" deps={[marco, celda, tinta, foto]} dibujar={(ctx, s) => { if (foto) componer(ctx, s, marco, foto.c, celda, TINTAS[tinta], foto.cara); }}>
        {revelando || !foto ? <div className="carga"><span>Revelando tu trama…</span></div>
          : cambiando ? <div className="carga"><span>{textoCambio}</span></div> : null}
      </Lienzo>
      </div>
    </PantallaHerramienta>
  );
}
