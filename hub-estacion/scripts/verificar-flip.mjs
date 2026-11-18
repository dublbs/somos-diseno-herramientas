// Revisa que el HUB compilado cargue en la Samsung Flip 2 (Tizen 5.0, Chromium ~69): sin `?.` ni `??`, que ese
// navegador no entiende y dejan la pantalla en blanco. Corre después de `vite build`; si falla, la compilación falla.
import { readdirSync, readFileSync } from 'node:fs';
const malos = [];
for (const f of readdirSync('dist/assets').filter(f => f.endsWith('.js'))) {
  const s = readFileSync(`dist/assets/${f}`, 'utf8');
  const m = s.match(/\?\.(?=[A-Za-z_$[(])|\?\?/g);
  if (m) malos.push(`${f}: ${m.length} (${JSON.stringify(s.slice(Math.max(0, s.search(/\?\.(?=[A-Za-z_$[(])|\?\?/) - 40), s.search(/\?\.(?=[A-Za-z_$[(])|\?\?/) + 20))})`);
}
if (malos.length) {
  console.error('El HUB usa sintaxis que la Flip 2 no entiende (revisa build.target en vite.config.ts):\n' + malos.join('\n'));
  process.exit(1);
}
console.log('Flip 2: sin ?. ni ?? en el HUB compilado.');
