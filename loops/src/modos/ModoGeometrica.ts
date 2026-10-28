import { HEX } from '../data/paletas';

export interface GeometricaParams {
  simetria: 4 | 8;
  velocidadGiro: number; // 1 a 5
  zoomPatron: number; // 0.8 a 2.5
  variante: 'damero' | 'zigzag' | 'acordeon';
  paleta: 'azul-rosa' | 'verde-amarillo' | 'lapis-hueso';
}

export class ModoGeometrica {
  private frameCount = 0;
  private anguloGiro = 0;
  private centroTouch: { x: number; y: number } | null = null;

  public setTouchOffset(x: number, y: number) {
    this.centroTouch = { x, y };
  }

  public resetTouch() {
    this.centroTouch = null;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: GeometricaParams
  ) {
    this.frameCount++;
    const cx = this.centroTouch ? this.centroTouch.x : width / 2;
    const cy = this.centroTouch ? this.centroTouch.y : height / 2;

    // Paleta seleccionada
    const colA =
      params.paleta === 'azul-rosa'
        ? HEX.Lapislázuli
        : params.paleta === 'verde-amarillo'
        ? HEX.Verde
        : HEX.Azul;
    const colB =
      params.paleta === 'azul-rosa'
        ? HEX.Rosa
        : params.paleta === 'verde-amarillo'
        ? HEX.Amarillo
        : HEX.Hueso;
    const colC =
      params.paleta === 'azul-rosa'
        ? HEX.Amarillo
        : params.paleta === 'verde-amarillo'
        ? HEX.Negro
        : HEX.Negro;

    // Fondo
    ctx.fillStyle = HEX.Hueso;
    ctx.fillRect(0, 0, width, height);

    this.anguloGiro += (params.velocidadGiro * 0.015);
    const radioMax = Math.hypot(width, height) * 0.75 * params.zoomPatron;
    const rayos = params.simetria;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.anguloGiro);

    // Bucle caleidoscópico por sector angular
    for (let s = 0; s < rayos; s++) {
      ctx.save();
      ctx.rotate((s * 2 * Math.PI) / rayos);
      if (s % 2 === 1) ctx.scale(-1, 1); // Efecto espejo caleidoscópico

      // Dibujar patrones del nodo C2 de Figma:
      // Anillos concéntricos alternados de damero / zigzag / acordeón
      const pasos = 8;
      const anchoAnillo = radioMax / pasos;

      for (let r = 1; r <= pasos; r++) {
        const dist = r * anchoAnillo;
        const pulso = Math.sin(this.frameCount * 0.1 + r * 0.4);

        if (params.variante === 'damero') {
          // Bloques damero que abren y cierran
          ctx.fillStyle = (r % 2 === 0) ? colA : colB;
          ctx.beginPath();
          ctx.arc(0, 0, dist, 0, Math.PI / rayos);
          ctx.arc(0, 0, Math.max(0, dist - anchoAnillo * 0.6), Math.PI / rayos, 0, true);
          ctx.fill();

          if (r % 2 === 0) {
            ctx.fillStyle = colC;
            ctx.fillRect(dist * 0.6, dist * 0.1, anchoAnillo * 0.35, anchoAnillo * 0.35);
          }
        } else if (params.variante === 'zigzag') {
          // Dientes de sierra / zigzag continuo
          ctx.strokeStyle = (r % 2 === 0) ? colA : colC;
          ctx.lineWidth = 4 + pulso * 2;
          ctx.beginPath();
          const d1 = dist - anchoAnillo * 0.5;
          ctx.moveTo(d1, 0);
          ctx.lineTo(dist, dist * 0.3);
          ctx.lineTo(d1, dist * 0.6);
          ctx.stroke();
        } else {
          // Acordeón / Rombo concéntrico
          ctx.fillStyle = (r % 3 === 0) ? colA : (r % 3 === 1) ? colB : colC;
          ctx.beginPath();
          ctx.moveTo(dist * 0.2, dist * 0.1);
          ctx.lineTo(dist * 0.6, dist * 0.3);
          ctx.lineTo(dist * 0.4, dist * 0.5);
          ctx.lineTo(dist * 0.1, dist * 0.3);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // Centro decorativo
    ctx.fillStyle = colC;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + Math.sin(this.frameCount * 0.15) * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
