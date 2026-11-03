export interface ParametrosC3 { fase: number; estallido: number; latido?: number; giro?: number }
export interface ColoresC3 { fondo?: string; tinta?: string; centro?: string }
export const C3_LOOP_MS: number;
export function estallidoDelCiclo(ciclo: number): number;
export function c3EnTiempo(ms: number): Required<ParametrosC3>;
export function dibujarC3(ctx: CanvasRenderingContext2D, W: number, H: number, p: ParametrosC3, colores?: ColoresC3): void;
