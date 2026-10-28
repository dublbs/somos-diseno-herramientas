import { HEX } from '../data/paletas';

export const PIE_PNG = 'Teatro de Papel · Creado en la estación interactiva';

export async function cargarFuentesTarjeta() {
  // Espera las fuentes para que la tarjeta no salga con la tipografía de respaldo.
  try {
    await Promise.all([
      document.fonts.load("800 28px 'DM Sans'"),
      document.fonts.load("600 20px 'IBM Plex Mono'"),
    ]);
  } catch { /* usa la fuente de respaldo */ }
}

// Dibuja la tarjeta de 1080 × 1350 alrededor del lienzo de origen (se usa para el PNG y para cada cuadro del video).
export function dibujarTarjetaMotion(
  ctx: CanvasRenderingContext2D,
  canvasOrigen: HTMLCanvasElement,
  nombreModo: string,
  subtitulo: string,
  pie: string = PIE_PNG
) {
  // Fondo mesa/papel
  ctx.fillStyle = HEX.Hueso;
  ctx.fillRect(0, 0, 1080, 1350);

  // Marco exterior
  ctx.strokeStyle = HEX.Negro;
  ctx.lineWidth = 12;
  ctx.strokeRect(36, 36, 1080 - 72, 1350 - 72);

  // Encabezado
  ctx.fillStyle = HEX.Negro;
  ctx.font = "800 28px 'DM Sans', sans-serif";
  ctx.fillText('SOMOS DISEÑO · SEMANA DEL DISEÑO 2026', 70, 110);

  ctx.fillStyle = HEX.Lapislázuli;
  ctx.font = "600 20px 'IBM Plex Mono', monospace";
  ctx.fillText(`TEATRO DE PAPEL · ${subtitulo.toUpperCase()}`, 70, 145);

  // Marco de la animación (cuadrado 940 × 940)
  const marcoX = 70;
  const marcoY = 180;
  const marcoW = 940;
  const marcoH = 940;

  ctx.fillStyle = '#000000';
  ctx.fillRect(marcoX, marcoY, marcoW, marcoH);

  // Dibujar el fotograma escalado
  ctx.drawImage(canvasOrigen, marcoX, marcoY, marcoW, marcoH);

  // Borde duro del marco
  ctx.strokeStyle = HEX.Negro;
  ctx.lineWidth = 8;
  ctx.strokeRect(marcoX, marcoY, marcoW, marcoH);

  // Sombra dura inferior del marco
  ctx.fillStyle = HEX.Amarillo;
  ctx.fillRect(marcoX + 8, marcoY + marcoH, marcoW, 14);

  // Pie de tarjeta
  ctx.fillStyle = HEX.Negro;
  ctx.font = "800 42px 'DM Sans', sans-serif";
  ctx.fillText(nombreModo, 70, 1200);

  ctx.fillStyle = '#55555e';
  ctx.font = "500 22px 'DM Sans', sans-serif";
  ctx.fillText(pie, 70, 1240);

  // Logo INACAP en rojo oficial (#E2001A)
  ctx.fillStyle = '#E2001A';
  ctx.font = "900 36px 'DM Sans', sans-serif";
  ctx.fillText('INACAP', 880, 1220);

  ctx.fillStyle = HEX.Negro;
  ctx.font = "600 16px 'IBM Plex Mono', monospace";
  ctx.fillText('SEDE SANTIAGO CENTRO', 780, 1246);
}

export async function exportarTarjetaMotion(
  canvasOrigen: HTMLCanvasElement,
  nombreModo: string,
  subtitulo: string
): Promise<Blob | null> {
  await cargarFuentesTarjeta();
  const tarjeta = document.createElement('canvas');
  tarjeta.width = 1080;
  tarjeta.height = 1350;
  const ctx = tarjeta.getContext('2d');
  if (!ctx) return null;
  dibujarTarjetaMotion(ctx, canvasOrigen, nombreModo, subtitulo);

  return new Promise((resolve) => {
    tarjeta.toBlob(resolve, 'image/png');
  });
}
