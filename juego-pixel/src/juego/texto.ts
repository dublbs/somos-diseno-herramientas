// Texto del juego sobre una placa oscura (B-010): los puntos que suben y los avisos se leen sobre cualquier fondo
// (vereda hueso, pasto, calle o andén). La placa es negra casi opaca, con un borde del mismo color del texto.
export function textoConPlaca(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, tam: number, color: string) {
  ctx.save();
  ctx.font = `700 ${Math.round(tam)}px "Silkscreen", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(texto).width, px = Math.round(tam * 0.4), py = Math.round(tam * 0.22);
  const bx = Math.round(x - w / 2 - px), by = Math.round(y - tam / 2 - py), bw = Math.round(w + 2 * px), bh = Math.round(tam + 2 * py);
  const b = Math.max(2, Math.round(tam / 10));
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = color; ctx.lineWidth = b; ctx.strokeRect(bx + b / 2, by + b / 2, bw - b, bh - b);
  ctx.fillStyle = color; ctx.fillText(texto, Math.round(x), Math.round(y + tam * 0.04));
  ctx.restore();
}
