import type { ReactNode } from 'react';
import { TINTAS } from '../data/tintas';
import type { Cara } from '../lib/cara';
import { componer } from '../lib/trama';
import { textoCara } from '../lib/estadoCara';
import { Lienzo } from './Lienzo';

export interface FotoEditable { c: HTMLCanvasElement; cara: Cara | null; afinada?: boolean }

interface Props {
  foto: FotoEditable | null; marco: string; celda: number; tinta: string;
  revelando: boolean; cambiando: boolean; textoCambio: string;
  ocupado: boolean; alGuardar: () => void; alLlevatela: () => void; alOtra: () => void;
  children?: ReactNode;
}

export function Editor({ foto, marco, celda, tinta, revelando, cambiando, textoCambio, ocupado, alGuardar, alLlevatela, alOtra }: Props) {
  const bloqueado = ocupado || revelando || cambiando || !foto;
  return (
    <div>
      <Lienzo deps={[marco, celda, tinta, foto]} dibujar={(ctx, s) => { if (foto) componer(ctx, s, marco, foto.c, celda, TINTAS[tinta], foto.cara); }}>
        {revelando || !foto ? <div className="carga"><span>Revelando tu trama…</span></div>
          : cambiando ? <div className="carga"><span>{textoCambio}</span></div> : null}
      </Lienzo>
      <div className="acciones">
        <button className="btn primario" onClick={alLlevatela} disabled={bloqueado}>{ocupado ? 'Preparando…' : 'Llévatela'}</button>
        <button className="btn" onClick={alGuardar} disabled={bloqueado}>Guardar imagen</button>
        <button className="btn" onClick={alOtra}>Otra foto</button>
      </div>
      <p className="nota">
        {foto && !revelando ? <span className="estado">{textoCara(foto.cara)}</span> : null}
        Se guarda en 1080 × 1350, listo para historias y feed.
      </p>
    </div>
  );
}
