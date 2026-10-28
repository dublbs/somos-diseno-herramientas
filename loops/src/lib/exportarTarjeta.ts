import { HEX } from '../data/paletas';

export function exportarTarjetaMotion(
  canvasOrigen: HTMLCanvasElement,
  nombreModo: string,
  subtitulo: string
): Promise<Blob | null> {
  const tarjeta = document.createElement('canvas');
  tarjeta.width = 1080;
  tarjeta.height = 1350;
  const ctx = tarjeta.getContext('2d');
  if (!ctx) return Promise.resolve(null);

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
  ctx.fillText(`ESTACIÓN DE LOOPS · ${subtitulo.toUpperCase()}`, 70, 145);

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
  ctx.fillText('Loop animado a 12 FPS · Creado en la estación interactiva', 70, 1240);

  // Logo INACAP en rojo oficial (#E2001A)
  ctx.fillStyle = '#E2001A';
  ctx.font = "900 36px 'DM Sans', sans-serif";
  ctx.fillText('INACAP', 880, 1220);

  ctx.fillStyle = HEX.Negro;
  ctx.font = "600 16px 'IBM Plex Mono', monospace";
  ctx.fillText('SEDE SANTIAGO CENTRO', 780, 1246);

  return new Promise((resolve) => {
    tarjeta.toBlob(resolve, 'image/png');
  });
}
