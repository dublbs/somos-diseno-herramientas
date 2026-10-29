// Arma el hub completo (portada + las apps ya compiladas) como un Artifact de varias páginas de claude.ai,
// para ver las experiencias en el celular sin hosting. No toca el código de las apps: copia sus dist/.
// Uso: npm run build && node scripts/artifact-hub.mjs  → artifact-hub/ (la portada es artifact-hub/index.html)
import { cpSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SALIDA = 'artifact-hub';
const APPS = ['fotomaton', 'taller-mosaicos', 'loops', 'graffiti', 'credencial', 'hub-estacion', 'audioreactiva', 'telar', 'grabado'];

// Dentro de claude.ai un <a download> no descarga: se pasa por la capacidad «downloads» del visor.
const DESCARGAS = `<script>(()=>{const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){const v=window.claude;if(!this.hasAttribute('download')||!v||!v.use)return c.call(this);const n=this.getAttribute('download')||'archivo',b=fetch(this.href).then(r=>r.blob());v.use('downloads').then(d=>d?b.then(x=>d.save({filename:n,data:x})):c.call(this)).catch(()=>{});};})();</script>`;

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });
cpSync('shared', join(SALIDA, 'shared'), { recursive: true, filter: f => !f.endsWith('.ts') && !f.endsWith('.md') });

for (const app of APPS) {
  const destino = join(SALIDA, app, 'dist');
  cpSync(join(app, 'dist'), destino, { recursive: true });
  const html = join(destino, 'index.html');
  writeFileSync(html, readFileSync(html, 'utf8').replace(/<head>/i, '<head>' + DESCARGAS));
}

// El visor no sirve .bin: los pesos del detector de caras del Fotomatón van con extensión .wasm (binario servido).
const modelo = join(SALIDA, 'fotomaton', 'dist', 'modelo');
for (const f of readdirSync(modelo).filter(n => n.endsWith('.bin'))) renameSync(join(modelo, f), join(modelo, f + '.wasm'));
for (const f of readdirSync(modelo).filter(n => n.endsWith('.json'))) {
  writeFileSync(join(modelo, f), readFileSync(join(modelo, f), 'utf8').replace(/\.bin"/g, '.bin.wasm"'));
}

// Portada: el visor pone su propio esqueleto, así que va sin doctype/html/head/body.
// Los enlaces a carpetas («fotomaton/dist/») apuntan al archivo, porque el visor no resuelve índices.
const hub = readFileSync('index.html', 'utf8');
const cabeza = hub.match(/<head>([\s\S]*?)<\/head>/i)[1].replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>/gi, '');
const cuerpo = hub.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
const portada = (DESCARGAS + cabeza + cuerpo).replace(/href="([a-z-]+)\/dist\/"/g, 'href="$1/dist/index.html"');
writeFileSync(join(SALIDA, 'index.html'), portada);

const archivos = [];
const recorrer = d => readdirSync(d).forEach(n => { const p = join(d, n); statSync(p).isDirectory() ? recorrer(p) : archivos.push(p.slice(SALIDA.length + 1)); });
recorrer(SALIDA);
writeFileSync(join(SALIDA, 'archivos.json'), JSON.stringify(archivos.filter(f => f !== 'index.html')));
console.log(`${SALIDA}/: ${archivos.length} archivos`);
