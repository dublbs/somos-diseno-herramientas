// Las exportaciones SVG de símbolos de Figma traen el fondo del lienzo (#1E1E1E y el marco #171717
// de la página). Este script los quita para que stickers, personajes y patrones queden transparentes.
// Uso: npm run limpiar:figma  (sobre public/figma/*.svg; se puede correr varias veces)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'public/figma/';
for (const f of readdirSync(dir).filter(n => n.endsWith('.svg'))) {
  const antes = readFileSync(dir + f, 'utf8');
  const despues = antes
    .replace(/<rect width="[\d.]+" height="[\d.]+" fill="#1E1E1E"\/>\n?/, '')
    .replace(/<rect width="2640" height="\d+" transform="translate\([^)]*\)" fill="#171717"\/>\n?/, '');
  if (despues !== antes) { writeFileSync(dir + f, despues); console.log('limpio', f); }
}
