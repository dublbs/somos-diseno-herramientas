// TEMPORAL: aísla el costo de la trama dentro de componer().
import { componer, trama } from './lib/trama';
import { TINTAS } from './data/tintas';
const img = new Image(); img.src = './_caras/c1.jpg';
img.onload = () => {
  const src = document.createElement('canvas'); src.width = 480; src.height = 360; src.getContext('2d')!.drawImage(img, 0, 0, 480, 360);
  const c = document.createElement('canvas'); c.width = c.height = 720; const x = c.getContext('2d')!;
  const r: Record<string, string> = {};
  const med = (n: string, f: () => void) => { f(); const a = performance.now(); for (let k = 0; k < 5; k++) f(); r[n] = ((performance.now() - a) / 5).toFixed(1); };
  med('trama450', () => trama(src, 450, 450, 5.74, TINTAS.cmyk, null));
  med('trama450+draw', () => { const t = trama(src, 450, 450, 5.74, TINTAS.cmyk, null); x.drawImage(t, 0, 0); });
  med('trama450+draw+get', () => { const t = trama(src, 450, 450, 5.74, TINTAS.cmyk, null); x.drawImage(t, 0, 0); x.getImageData(0, 0, 1, 1); });
  med('OM05', () => componer(x, 720, 'OM05', src, 2.5, TINTAS.cmyk, null));
  med('OM05+get', () => { componer(x, 720, 'OM05', src, 2.5, TINTAS.cmyk, null); x.getImageData(0, 0, 1, 1); });
  med('GM05+get', () => { componer(x, 720, 'GM05', src, 2.5, TINTAS.cmyk, null); x.getImageData(0, 0, 1, 1); });
  console.error(JSON.stringify(r)); document.title = 'listo';
};
