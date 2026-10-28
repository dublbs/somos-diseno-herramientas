import { HEX } from '../data/paletas';

export interface OrganicaParams {
  balanceo: number; // 1 a 5
  floracion: number; // 0.5 a 2.0
  texturaPapel: boolean;
  colorPrincipal: 'verde' | 'rosa' | 'celeste';
}

export class ModoOrganica {
  private frameCount = 0;
  private arrastrando = false;
  private cuerdaY = 0;
  private cuerdaVel = 0;

  public jalarCuerda() {
    this.cuerdaVel = 18;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: OrganicaParams
  ) {
    this.frameCount++;
    const s = Math.min(width, height) / 380;
    const cx = width / 2;

    // Física de la cuerda/resorte
    this.cuerdaY += this.cuerdaVel;
    this.cuerdaVel -= this.cuerdaY * 0.12; // Resorte
    this.cuerdaVel *= 0.88; // Amortiguación

    // Fondo papel cálido artesanal
    ctx.fillStyle = HEX.Hueso;
    ctx.fillRect(0, 0, width, height);

    // Textura sutil de grano de papel
    if (params.texturaPapel) {
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }
    }

    const t = this.frameCount * 0.08 * params.balanceo;
    const oscilacion1 = Math.sin(t);
    const oscilacion2 = Math.cos(t * 0.8);

    const colP =
      params.colorPrincipal === 'verde'
        ? HEX.Verde
        : params.colorPrincipal === 'rosa'
        ? HEX.Rosa
        : HEX.Celeste;
    const colS = params.colorPrincipal === 'verde' ? HEX.Amarillo : HEX.Lapislázuli;

    // 1. Tallo botánico articulado que sube desde abajo
    const raizX = cx;
    const raizY = height;
    const nodo1X = cx + oscilacion1 * 18 * s;
    const nodo1Y = height - 120 * s + this.cuerdaY * 0.3;
    const nodo2X = nodo1X + oscilacion2 * 25 * s;
    const nodo2Y = nodo1Y - 100 * s;

    ctx.strokeStyle = HEX.Negro;
    ctx.lineWidth = 14 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(raizX, raizY);
    ctx.quadraticCurveTo(nodo1X, (raizY + nodo1Y) / 2, nodo1X, nodo1Y);
    ctx.quadraticCurveTo(nodo2X, (nodo1Y + nodo2Y) / 2, nodo2X, nodo2Y);
    ctx.stroke();

    ctx.strokeStyle = colP;
    ctx.lineWidth = 10 * s;
    ctx.stroke();

    // 2. Hojas de Helecho recortadas (FA03 de Orgánica) que se abren a los lados
    const dibujarHoja = (x: number, y: number, angulo: number, tam: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angulo);
      ctx.fillStyle = colP;
      ctx.strokeStyle = HEX.Negro;
      ctx.lineWidth = 3 * s;

      // Forma recortada con sombra dura de papel
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(20 * s, -15 * s, 45 * s, -10 * s, 60 * s * tam, 0);
      ctx.bezierCurveTo(45 * s, 10 * s, 20 * s, 15 * s, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Remache de papel en la articulación
      ctx.fillStyle = HEX.Amarillo;
      ctx.beginPath();
      ctx.arc(0, 0, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    dibujarHoja(nodo1X, nodo1Y, -0.6 + oscilacion1 * 0.25, 1.2);
    dibujarHoja(nodo1X, nodo1Y, Math.PI + 0.6 - oscilacion1 * 0.25, 1.0);

    // 3. Gran Flor / Marioneta en la cúspide (FA12)
    ctx.save();
    ctx.translate(nodo2X, nodo2Y);
    ctx.rotate(oscilacion1 * 0.3);

    const numPetalos = 6;
    const escalaFlor = (1 + Math.sin(t * 1.2) * 0.15) * params.floracion;

    for (let i = 0; i < numPetalos; i++) {
      const ang = (i * 2 * Math.PI) / numPetalos + oscilacion2 * 0.1;
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = colS;
      ctx.strokeStyle = HEX.Negro;
      ctx.lineWidth = 3 * s;

      ctx.beginPath();
      ctx.ellipse(32 * s * escalaFlor, 0, 24 * s * escalaFlor, 14 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Centro de la flor con cara simpática de marioneta
    ctx.fillStyle = HEX.Amarillo;
    ctx.strokeStyle = HEX.Negro;
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ojos móviles estilo stop-motion
    const ojoOffsetX = oscilacion2 * 3 * s;
    const ojoOffsetY = oscilacion1 * 3 * s;
    ctx.fillStyle = HEX.Negro;
    ctx.beginPath();
    ctx.arc(-8 * s + ojoOffsetX, -4 * s + ojoOffsetY, 3.5 * s, 0, Math.PI * 2);
    ctx.arc(8 * s + ojoOffsetX, -4 * s + ojoOffsetY, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa
    ctx.beginPath();
    ctx.arc(0, 4 * s, 8 * s, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();

    // 4. Cuerda colgante táctil interactiva
    ctx.strokeStyle = '#6a655c';
    ctx.lineWidth = 2 * s;
    ctx.setLineDash([6 * s, 4 * s]);
    ctx.beginPath();
    ctx.moveTo(nodo2X, nodo2Y + 40 * s);
    ctx.lineTo(nodo2X, nodo2Y + 120 * s + this.cuerdaY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pomo de madera de la cuerda
    ctx.fillStyle = HEX.Amarillo;
    ctx.strokeStyle = HEX.Negro;
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(nodo2X, nodo2Y + 124 * s + this.cuerdaY, 7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
