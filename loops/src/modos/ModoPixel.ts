import { HEX } from '../data/paletas';

export interface PixelParams {
  velocidad: number; // 1 a 5
  alturaSalto: number; // 20 a 80
  densidadMonedas: number; // 1 a 4
  colorTinta: string;
}

export class ModoPixel {
  private frameCount = 0;
  private saltando = false;
  private saltoY = 0;
  private saltoVel = 0;
  private scrollOffset = 0;
  private estrellas: { x: number; y: number; vida: number }[] = [];

  public dispararSalto() {
    if (!this.saltando) {
      this.saltando = true;
      this.saltoVel = -12;
    }
  }

  public agregarEstrella(x: number, y: number) {
    this.estrellas.push({ x, y, vida: 1.0 });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: PixelParams
  ) {
    this.frameCount++;
    const s = Math.min(width, height) / 360;

    // Fondo cielo
    ctx.fillStyle = params.colorTinta === 'morado' ? '#1d152b' : '#0e1726';
    ctx.fillRect(0, 0, width, height);

    // Desplazamiento
    this.scrollOffset += params.velocidad * 1.5;

    // 1. Montañas de fondo (Parallax lento)
    ctx.fillStyle = params.colorTinta === 'morado' ? '#3b2559' : '#1c3459';
    const montanhasOffset = (this.scrollOffset * 0.25) % (120 * s);
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = -montanhasOffset; x < width + 120 * s; x += 120 * s) {
      ctx.lineTo(x + 60 * s, height - 160 * s);
      ctx.lineTo(x + 120 * s, height - 40 * s);
    }
    ctx.lineTo(width, height);
    ctx.fill();

    // 2. Colinas intermedias (Parallax medio)
    ctx.fillStyle = params.colorTinta === 'morado' ? '#5a3885' : '#2b4bd8';
    const colinasOffset = (this.scrollOffset * 0.5) % (80 * s);
    for (let x = -colinasOffset; x < width + 80 * s; x += 80 * s) {
      ctx.beginPath();
      ctx.arc(x + 40 * s, height - 50 * s, 45 * s, Math.PI, 0);
      ctx.fill();
    }

    // 3. Suelo de bloques pixel art
    const sueloY = height - 50 * s;
    ctx.fillStyle = HEX.Negro;
    ctx.fillRect(0, sueloY, width, 50 * s);

    ctx.fillStyle = HEX.Amarillo;
    ctx.fillRect(0, sueloY, width, 4 * s);

    const bloqueTam = 20 * s;
    const bloqueOffset = this.scrollOffset % bloqueTam;
    ctx.fillStyle = HEX.Hueso;
    for (let x = -bloqueOffset; x < width + bloqueTam; x += bloqueTam) {
      ctx.fillRect(x + 2 * s, sueloY + 8 * s, bloqueTam - 4 * s, 6 * s);
      ctx.fillRect(x + 6 * s, sueloY + 20 * s, bloqueTam - 8 * s, 6 * s);
    }

    // 4. Monedas / Gemas giratorias (4 fotogramas en bucle)
    const pasoMoneda = (Math.floor(this.frameCount / 3) % 4);
    const anchoMoneda = [12, 8, 3, 8][pasoMoneda] * s;
    const monedaEspaciado = (240 / params.densidadMonedas) * s;
    const monedaOffset = (this.scrollOffset * 1.0) % monedaEspaciado;

    ctx.fillStyle = HEX.Amarillo;
    for (let x = -monedaOffset + 100 * s; x < width + monedaEspaciado; x += monedaEspaciado) {
      const my = sueloY - 70 * s + Math.sin((x + this.scrollOffset) * 0.05) * 6 * s;
      ctx.beginPath();
      ctx.ellipse(x, my, anchoMoneda, 14 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = HEX.Negro;
      ctx.lineWidth = 2 * s;
      ctx.stroke();
    }

    // 5. Física y dibujo del Personaje Pixel
    if (this.saltando) {
      this.saltoY += this.saltoVel;
      this.saltoVel += 0.8; // Gravedad
      if (this.saltoY >= 0) {
        this.saltoY = 0;
        this.saltando = false;
        this.saltoVel = 0;
      }
    }

    const charX = width * 0.28;
    const charY = sueloY - 36 * s + this.saltoY;
    const walkFrame = Math.floor(this.frameCount / 3) % 4;

    // Sombra del personaje
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(charX + 12 * s, sueloY, 14 * s * (1 - Math.min(0.5, -this.saltoY / 100)), 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar Sprite 8-bit (cuerpo geométrico pixelado)
    ctx.fillStyle = HEX.Rosa;
    ctx.fillRect(charX, charY, 24 * s, 26 * s);

    // Ojos
    ctx.fillStyle = HEX.Negro;
    ctx.fillRect(charX + 14 * s, charY + 6 * s, 4 * s, 6 * s);
    ctx.fillStyle = HEX.Blanco;
    ctx.fillRect(charX + 16 * s, charY + 6 * s, 2 * s, 2 * s);

    // Visera / Casco
    ctx.fillStyle = HEX.Lapislázuli;
    ctx.fillRect(charX - 2 * s, charY - 4 * s, 28 * s, 8 * s);
    ctx.fillRect(charX + 16 * s, charY, 10 * s, 4 * s);

    // Piernas animadas en ciclo de carrera
    ctx.fillStyle = HEX.Negro;
    if (this.saltando) {
      ctx.fillRect(charX + 2 * s, charY + 26 * s, 6 * s, 6 * s);
      ctx.fillRect(charX + 16 * s, charY + 22 * s, 6 * s, 6 * s);
    } else {
      const pierna1 = [0, 6, 0, -4][walkFrame] * s;
      const pierna2 = [0, -4, 0, 6][walkFrame] * s;
      ctx.fillRect(charX + 4 * s, charY + 26 * s, 6 * s, 8 * s + pierna1);
      ctx.fillRect(charX + 14 * s, charY + 26 * s, 6 * s, 8 * s + pierna2);
    }

    // 6. Efecto de estrellas táctiles al tocar
    for (let i = this.estrellas.length - 1; i >= 0; i--) {
      const est = this.estrellas[i];
      est.y -= 2 * s;
      est.vida -= 0.05;
      if (est.vida <= 0) {
        this.estrellas.splice(i, 1);
        continue;
      }
      ctx.fillStyle = HEX.Amarillo;
      ctx.globalAlpha = est.vida;
      const tamE = 8 * s * est.vida;
      ctx.fillRect(est.x - tamE / 2, est.y - tamE / 2, tamE, tamE);
      ctx.globalAlpha = 1.0;
    }
  }
}
