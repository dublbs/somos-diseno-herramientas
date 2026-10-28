// Arma una sola página autocontenida (JS, CSS y fuentes adentro) a partir de dist/ para
// publicarla como Artifact de claude.ai y probar la credencial en el celular sin hosting.
// Uso: npm run build && npm run artifact  → artifact/index.html
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';

const assets = 'dist/assets/';
const archivos = readdirSync(assets);
const js = archivos.find(f => f.endsWith('.js'));
const css = archivos.find(f => f.endsWith('.css'));
const estilos = readFileSync(assets + css, 'utf8').replace(/url\(\.\/([^)]+\.woff2)\)/g, (_, f) =>
  `url(data:font/woff2;base64,${readFileSync(assets + f).toString('base64')})`);
const codigo = readFileSync(assets + js, 'utf8').replace(/<\/script/gi, '<\\/script');

// El visor de claude.ai pone el esqueleto (doctype, head, body): aquí va solo el contenido.
const pagina = `<title>Credencial Somos Diseño</title>
<meta name="theme-color" content="#F4EEE3">
<style>${estilos}</style>
<div id="app"></div>
<script type="module">${codigo}</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/index.html', pagina);
console.log(`artifact/index.html (${Math.round(pagina.length / 1024)} KB)`);
