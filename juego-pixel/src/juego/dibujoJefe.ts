// Dibuja la pelea con el Inacapín (plan 009-juego-pixel, ronda 3) sobre la arena del andén: el Inacapín de Figma,
// gris, que camina, se agacha, salta, escupe, embiste y recupera su rojo desde los pies con cada golpe.
import { ALTO_A, ANCHO_A } from './anden';
import { dibujarAvisos, dibujarGrises, dibujarJugador, dibujarTiros, escenario, marco, mezclarTema, pasoEfectos, TEMAS } from './dibujoAnden';
import { escenaLlegada } from './llegada';
import type { Imagenes } from './dibujoCruce';
import { avanzarEfectos, dibujarManchas, dibujarParticulas, sacudida } from './efectos';
import { textoConPlaca } from './texto';
import { ALTO_JEFE, ANCHO_JEFE, GOLPES_GRIS, GOLPES_JEFE, VIGAS_JEFE, type Jefe } from './jefe';
import { dibujarGris, dibujarInacapin } from './personajes';
import { PIEZAS, sprite } from './sprites';

const COLORES_FIESTA = ['#E2001A', '#FF8FB1', '#FFC20E', '#7FC8F8', '#00A651', '#7A2E8E', '#F4EEE3'];

const aterrizados = new WeakSet<object>();

// `llegada` (ms): dibuja la escena de llegada del Inacapín (B-008, ver `llegada.ts`) en vez de la pelea.
export function dibujarJefe(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Jefe, img: Imagenes, ahora: number, quieto = false, mandoAlto = 0, llegada?: number) {
  const m = marco(ancho, alto, mandoAlto), { c, X, Y } = m;
  const celebra = e.celebra > 0 || e.fin === 'victoria';
  const rojo = celebra ? 1 : e.golpes / GOLPES_JEFE;
  const L = llegada === undefined ? null : escenaLlegada(llegada, quieto);
  if (L?.aterrizo && !aterrizados.has(e)) { // el golpe al caer: polvo y sacudida (sin sacudida con movimiento reducido)
    aterrizados.add(e);
    e.eventos.push({ tipo: 'aterriza', x: e.jefe.x + ANCHO_JEFE / 2, y: e.jefe.y, color: '#8F8F8A' });
  }
  avanzarEfectos(e, e.eventos, e.grises, VIGAS_JEFE, pasoEfectos(e, ahora), quieto);
  const [sx, sy] = sacudida(e, c, ahora);
  ctx.save(); ctx.translate(sx, sy);
  // B-008: con el Inacapín el andén se pone morado en penumbra, con franja y luz rojas.
  if (L) escenario(ctx, ancho, alto, m, VIGAS_JEFE, img, '', (1 - rojo) * L.cambio, mezclarTema(TEMAS.ronda2, TEMAS.jefe, L.cambio), L.apagon);
  else escenario(ctx, ancho, alto, m, VIGAS_JEFE, img, '', 1 - rojo, TEMAS.jefe);
  dibujarManchas(ctx, m, e);
  const parpadeo = Math.floor(ahora / 130) % 2 === 0;

  // Avisos en el techo: columnas de gotas y Grises que van a caer.
  for (const mk of e.marcas) {
    const on = quieto || parpadeo;
    ctx.globalAlpha = 0.16; ctx.fillStyle = '#000'; ctx.fillRect(X(mk.x + 0.1), Y(0), Math.round(c * 0.8), (ALTO_A - 1) * c); ctx.globalAlpha = 1;
    ctx.fillStyle = on ? '#FFC20E' : '#000'; ctx.fillRect(X(mk.x + 0.1), Y(ALTO_A - 1) - Math.round(c * 0.16), Math.round(c * 0.8), Math.round(c * 0.16));
    if (mk.tipo === 'gota') sprite(ctx, PIEZAS.gota, X(mk.x + 0.2), Y(0.15), c * 0.6, c * 0.6, '#8F8F8A');
    else dibujarGris(ctx, X(mk.x + 0.5), Y(0.9), c * 0.8, 'salto', 1);
  }

  // El Inacapín.
  const b = e.jefe, pieX = X(b.x + ANCHO_JEFE / 2), pieY = Y(b.y), tam = ALTO_JEFE * c * 1.1; // el sprite tiene piernas
  // sombra en el piso bajo él (y la de su caída, si salta)
  const sombraEn = (x: number, y: number, ancho: number, a: number) => { ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.fillRect(X(x) - Math.round(ancho * c / 2), Y(y) - Math.round(c * 0.12), Math.round(ancho * c), Math.round(c * 0.14)); ctx.globalAlpha = 1; };
  if (L) { // llegada: cae desde el techo (su sombra crece en el piso) y ruge
    if (L.visible) {
      const cerca = 1 - Math.min(1, L.cae / (ALTO_A + ALTO_JEFE));
      sombraEn(b.x + ANCHO_JEFE / 2, b.y, ANCHO_JEFE * (0.4 + 0.7 * cerca), 0.12 + 0.18 * cerca);
      dibujarInacapin(ctx, pieX, pieY - Math.round(L.cae * c), tam, b.mira, 0, { boca: L.ruge, ojos: 'enojo' }, L.aplasta);
    }
  } else {
    if (b.estado === 'salta' && b.destino) { // dónde va a caer: la sombra crece y parpadea
      const cerca = Math.max(0.2, Math.min(1, 1 - (b.destino.y - b.y) / 6));
      sombraEn(b.destino.x + ANCHO_JEFE / 2, b.destino.y, ANCHO_JEFE * (0.5 + cerca * 0.6), 0.25 + (parpadeo ? 0.2 : 0));
    } else sombraEn(b.x + ANCHO_JEFE / 2, b.y, ANCHO_JEFE * 1.1, 0.28);

    let aplasta = 1, dx = 0;
    const avisando = b.estado === 'agacha' || b.estado === 'carga' || b.estado === 'escupe';
    if (b.estado === 'agacha') aplasta = quieto ? 0.85 : 0.86 + 0.04 * Math.sin(ahora / 40);
    if (b.estado === 'carga') { aplasta = 0.62; dx = quieto ? 0 : Math.sin(ahora / 25) * c * 0.06; }
    if (b.estado === 'embiste') aplasta = 0.6;
    if (b.estado === 'salta') aplasta = b.vy < 0 ? 1.08 : 1.02;
    if (b.estado === 'mareado') aplasta = 0.95;
    const respira = quieto || b.estado !== 'camina' ? 0 : Math.round(Math.sin(ahora / 260) * c * 0.03);
    const fiesta = celebra && !quieto ? Math.abs(Math.sin(ahora / 160)) * c * 0.7 : 0;
    const paso = b.estado === 'camina' && !quieto ? ((Math.floor(ahora / 180) % 2) + 1) as 1 | 2 : 0;
    // brillo de aviso (telegrafía): su silueta en amarillo (salto o escupo) o rosado (embestida), parpadeando
    if (avisando && !celebra && (quieto || parpadeo)) {
      const col = b.estado === 'carga' ? '#FF8FB1' : '#FFC20E', o = Math.max(3, Math.round(c * 0.09));
      const boca = b.estado === 'escupe';
      for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]])
        dibujarInacapin(ctx, pieX + dx + ox, pieY + oy, tam, b.mira, 0, { silueta: col, boca }, aplasta);
    }
    dibujarInacapin(ctx, pieX + dx, pieY + respira - fiesta, tam, b.mira, rojo, {
      boca: b.estado === 'escupe' || celebra || b.estado === 'ruge',
      blanco: e.herido > 0 && Math.floor(ahora / 70) % 2 === 0,
      ojos: celebra ? 'feliz' : e.herido > 0 || b.estado === 'mareado' ? 'x' : b.estado === 'carga' || b.estado === 'embiste' || b.estado === 'ruge' ? 'enojo' : null,
      paso,
    }, aplasta);
  }
  // flecha de la embestida
  if (b.estado === 'carga' && (quieto || parpadeo)) {
    const fx = b.mira > 0 ? X(b.x + ANCHO_JEFE + 0.4) : X(b.x - 1.2), fy = Y(b.y - 0.9), s = Math.round(c * 0.16);
    ctx.fillStyle = '#000'; ctx.fillRect(fx - 2, fy - s - 2, s * 5 + 4, s * 3 + 4);
    ctx.fillStyle = '#FF8FB1';
    for (let k = 0; k < 5; k++) { const h = (b.mira > 0 ? 5 - k : k + 1) * 0.6; ctx.fillRect(fx + k * s, fy - (h * s) / 2 + s / 2, s, Math.max(s, h * s)); }
  }
  // líneas de velocidad al embestir
  if (b.estado === 'embiste' && !quieto) {
    ctx.fillStyle = '#FFFFFF';
    for (let k = 0; k < 4; k++) ctx.fillRect(b.mira > 0 ? X(b.x - 0.8 - k * 0.3) : X(b.x + ANCHO_JEFE + 0.2 + k * 0.3), Y(b.y - 0.4 - k * 0.35), Math.round(c * 0.5), Math.max(2, Math.round(c * 0.06)));
  }
  // estrellas de mareo
  if (b.estado === 'mareado' && !quieto) for (let k = 0; k < 4; k++) {
    const a = ahora / 200 + k * 1.57, x = pieX + Math.cos(a) * c * 1.1, y = Y(b.y - ALTO_JEFE - 0.4) + Math.sin(a) * c * 0.2;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, c * 0.2 + 4, c * 0.2 + 4); ctx.fillStyle = '#FFC20E'; ctx.fillRect(x, y, c * 0.2, c * 0.2);
  }

  // Ondas que corren por el piso y gotas grises.
  for (const o of e.ondas) {
    const ox = X(o.x), base = Y(ALTO_A - 1);
    for (let k = 0; k < 4; k++) {
      const h = Math.round(c * (0.55 - k * 0.12)), w = Math.round(c * 0.2);
      const x = ox - o.dir * k * w - w / 2;
      ctx.fillStyle = '#000'; ctx.fillRect(x - 2, base - h - 2, w + 4, h + 2);
      ctx.fillStyle = k % 2 ? '#B9B9B3' : '#8F8F8A'; ctx.fillRect(x, base - h, w, h);
    }
  }
  for (const g of e.gotas) sprite(ctx, PIEZAS.gota, X(g.x - 0.35), Y(g.y - 0.75), c * 0.7, c * 0.7, '#8F8F8A');

  dibujarGrises(ctx, m, e.grises, VIGAS_JEFE, ahora, () => GOLPES_GRIS, quieto);
  dibujarTiros(ctx, m, e.tiros);
  if (e.fin !== 'derrota') dibujarJugador(ctx, m, e.jugador, e.invulnerable, e.tiros, VIGAS_JEFE, ahora, quieto);
  dibujarParticulas(ctx, m, e, ancho, alto);

  // Celebración: papel picado de los colores que recuperó.
  if (celebra) {
    for (let k = 0; k < 70; k++) {
      const t = quieto ? 0.5 : ((ahora / 2200 + k * 0.137) % 1);
      const x = X(((k * 7.31) % ANCHO_A)), y = Y(t * ALTO_A);
      ctx.fillStyle = COLORES_FIESTA[k % COLORES_FIESTA.length]; ctx.fillRect(x, y, Math.round(c * 0.18), Math.round(c * 0.18));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(c * 0.62)}px "Silkscreen", monospace`;
    textoConPlaca(ctx, '¡Le devolviste el color!', X(ANCHO_A / 2), Y(2.6), c * 0.62, '#FFC20E');
  }
  dibujarAvisos(ctx, m, e.avisos, '#FFC20E');
  if (L?.ruge) {
    textoConPlaca(ctx, '¡Llegó el Inacapín!', X(ANCHO_A / 2), Y(2.7), c * 0.72, '#FFC20E');
    textoConPlaca(ctx, 'Devuélvele el color', X(ANCHO_A / 2), Y(3.75), c * 0.42, '#F4EEE3');
  }
  ctx.restore();
}

// Retrato del Inacapín (tarjeta de entrada): de cuerpo entero en un canvas cuadrado.
export function retratoInacapin(ctx: CanvasRenderingContext2D, lado: number, rojo: number) {
  dibujarInacapin(ctx, lado / 2, lado, lado, -1, rojo);
}
