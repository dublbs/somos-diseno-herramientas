// Hoja de sprites para revisar el arte a ojo (no va al juego): `npx vite` y abrir /preview-sprites.html.
import { dibujarBola, dibujarGris, dibujarInacapin, dibujarPinta, type Pose } from '../src/juego/personajes';

const c = document.getElementById('c') as HTMLCanvasElement, x = c.getContext('2d')!;
x.fillStyle = '#F4EEE3'; x.fillRect(0, 0, c.width, c.height);
const poses: Pose[] = ['quieto', 'camina1', 'camina2', 'salta', 'lanza', 'golpe'];
poses.forEach((p, i) => dibujarPinta(x, 70 + i * 120, 130, 96, p, 1));
dibujarPinta(x, 70 + 6 * 120, 130, 96, 'quieto', -1);
(['a', 'b', 'salto'] as const).forEach((f, i) => dibujarGris(x, 70 + i * 110, 280, 84, f, 1));
[0.34, 0.67, 1].forEach((n, i) => dibujarGris(x, 420 + i * 110, 280, 84, 'a', 1, '#FF8FB1', n));
dibujarGris(x, 760, 280, 84, 'a', -1, '#7FC8F8', 0.5, true);
[0, 0.8, 1.6, 2.4].forEach((g, i) => dibujarBola(x, 900 + i * 100, 240, 40, ['#FF8FB1', '#FFC20E', '#7FC8F8', '#00A651'][i], g));
[0, 0.33, 0.66, 1].forEach((r, i) => dibujarInacapin(x, 120 + i * 240, 600, 220, -1, r));
dibujarInacapin(x, 1080, 600, 220, 1, 0.5, { boca: true });
dibujarInacapin(x, 120, 860, 220, 1, 0.2, { ojos: 'x', blanco: false });
dibujarInacapin(x, 360, 860, 220, 1, 1, { ojos: 'feliz' });
dibujarInacapin(x, 600, 860, 220, -1, 0.2, { ojos: 'enojo', paso: 1 }, 0.7);
// Latas de spray (B-007), en los colores de la pintura.
import { LATA, LATA_PROPORCION, sprite } from '../src/juego/sprites';
['#FF8FB1', '#FFC20E', '#7FC8F8', '#00A651', '#7A2E8E'].forEach((col, i) => sprite(x, LATA, 1060 + i * 64, 650, 90 * LATA_PROPORCION, 90, col));
