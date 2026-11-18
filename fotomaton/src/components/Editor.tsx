import { TINTAS } from '../data/tintas';
import type { Cara } from '../lib/cara';
import { componer } from '../lib/trama';
import { textoCara } from '../lib/estadoCara';
import { Lienzo } from './Lienzo';
import { Disparador } from './Disparador';
import type { ReactNode } from 'react';
import { LienzoAjustado, MarcoHerramienta } from '../../../shared/ui/Herramienta';

export interface FotoEditable { c: HTMLCanvasElement; cara: Cara | null; afinada?: boolean }

interface Props {
  foto: FotoEditable | null; marco: string; celda: number; tinta: string; apagadas: readonly string[];
  revelando: boolean; cambiando: boolean; textoCambio: string;
  ocupado: boolean; alLlevatela: () => void; alOtra: () => void;
  volver: string; acciones: ReactNode; panel: ReactNode; aviso?: ReactNode;
}

// Editor sobre el kit v2 (plan 014): «Llévatela» es el primario de la barra superior; abajo, «Otra foto».
export function Editor({ foto, marco, celda, tinta, apagadas, revelando, cambiando, textoCambio, ocupado, alLlevatela, alOtra, volver, acciones, panel, aviso }: Props) {
  const bloqueado = ocupado || revelando || cambiando || !foto;
  const estado = foto && !revelando ? textoCara(foto.cara) : 'Revelando tu trama…';
  return (
    <MarcoHerramienta titulo="Fotomatón" volver={volver} ayuda="Se guarda en 1080 × 1350, listo para historias y feed"
      acciones={acciones} anchoPanel={320} panel={panel} aviso={aviso}
      primario={{ texto: ocupado ? 'Preparando…' : 'Llévatela', icono: 'ios_share', onClick: alLlevatela, disabled: bloqueado }}
      herramientas={<div className="pie-foto"><p className="estado-foto" role="status">{estado}</p>
        <Disparador texto="Otra foto" etiqueta="Sacar otra foto" onClick={alOtra} disabled={ocupado} /><span /></div>}>
      <LienzoAjustado proporcion={1} className="foto-lienzo">
        <Lienzo deps={[marco, celda, tinta, foto, apagadas]} dibujar={(ctx, s) => { if (foto) componer(ctx, s, marco, foto.c, celda, TINTAS[tinta], foto.cara, { apagadas }); }}>
          {revelando || !foto ? <div className="carga"><span>Revelando tu trama…</span></div>
            : cambiando ? <div className="carga"><span>{textoCambio}</span></div> : null}
        </Lienzo>
      </LienzoAjustado>
    </MarcoHerramienta>
  );
}
