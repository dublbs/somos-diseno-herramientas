// Tablet (Graffiti) contra la base «qa»: entrar con código, crear, y qué pasa si la base no confirma el timbre.
process.env.PGDB = 'qa';
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const { responder } = require('./falso-sb.cjs');
const sql = q => execFileSync('psql', ['-U', process.env.PGUSER || 'postgres', '-d', 'qa', '-tAq', '-c', q]).toString().trim();
const espera = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.BASE || 'http://localhost:8104/'; // la raíz del repo servida (python3 -m http.server 8104)
(async () => {
  sql("insert into config (clave, valor) values ('mesas_modo_juego', 'si') on conflict (clave) do update set valor = 'si'");
  const nuevo = sql("set role anon; insert into credenciales (nombre, receta) values ('Tablet', '{}') returning codigo").split('\n').pop();
  sql("alter table credenciales disable trigger user");
  sql("insert into credenciales (codigo, nombre, receta) values ('SD-10A0F', 'Vieja', '{}') on conflict do nothing");
  sql("alter table credenciales enable trigger user");
  const b = await chromium.launch();
  let fallarSellar = false;
  const abrir = async () => {
    const ctx = await b.newContext({ viewport: { width: 1180, height: 820 } });
    await ctx.route(/opvwftwvfdhhrqwpjvlx\.supabase\.co/, async route => {
      const r = route.request();
      if (fallarSellar && r.url().includes('/rpc/sellar')) return route.fulfill({ status: 503, body: '{}' });
      const [st, c] = responder('', {}, r.method(), r.url(), r.postData(), r.headers());
      await route.fulfill({ status: st, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: c == null ? '' : JSON.stringify(c) });
    });
    const p = await ctx.newPage(); const errores = []; p.on('pageerror', e => errores.push(e.message));
    await p.goto(BASE + 'graffiti/dist/'); await espera(2500);
    return { p, ctx, errores };
  };
  const entrar = async (p, cod) => { await p.fill('#codigo-credencial', cod); await p.getByRole('button', { name: /^(Entrar|Revisando)/ }).click(); await espera(1500); return p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')); };

  let { p, ctx, errores } = await abrir();
  let t = await entrar(p, 'SD-ZZZZ9');
  console.log('1. Código bien formado que NO existe →', t.includes('No encontramos la credencial SD-ZZZZ9') ? 'avisa «No encontramos…» y no deja jugar' : 'DEJA JUGAR: ' + t.slice(0, 80));
  t = await entrar(p, 'SD-10A0F');
  console.log('2. Código viejo con 0 y 1 (existe) →', !t.includes('Escribe el código') && !t.includes('No encontramos') ? 'entra' : 'NO ENTRA');
  await ctx.close(); ({ p, ctx, errores } = await abrir());
  t = await entrar(p, nuevo.toLowerCase());
  console.log(`3. Código nuevo de la base (${nuevo}), escrito en minúsculas →`, !t.includes('No encontramos') ? 'entra' : 'NO ENTRA');

  // Crear: saltar el tutorial, pintar y «Llévatelo», primero con la base caída para el timbre.
  const saltar = p.locator('.k-tutorial-acciones button').first(); if (await saltar.count()) { await saltar.click(); await espera(800); }
  const lienzo = p.locator('canvas').first(); const c = await lienzo.boundingBox();
  await p.mouse.move(c.x + c.width * .4, c.y + c.height * .4); await p.mouse.down();
  for (let i = 0; i < 12; i++) await p.mouse.move(c.x + c.width * (.4 + i * .02), c.y + c.height * (.4 + i * .015));
  await p.mouse.up(); await espera(500);
  fallarSellar = true;
  await p.getByRole('button', { name: /Llévatelo/ }).click(); await espera(3000);
  const ganado1 = await p.evaluate(() => JSON.parse(sessionStorage.getItem('sd:jugador') || 'null'));
  const timbresHub1 = sql(`select count(*) from eventos where tipo = 'timbre' and codigo = '${nuevo}' and datos->>'sello' = '2'`);
  console.log('4. «Llévatelo» con la base sin responder al timbre → ganado:', JSON.stringify(ganado1 && ganado1.ganado), '| timbres falsos en el HUB:', timbresHub1);
  await p.keyboard.press('Escape'); await espera(400);
  const cerrar = p.getByRole('button', { name: /cerrar|volver|seguir|listo|entendido/i }).first(); if (await cerrar.count()) { await cerrar.click().catch(() => {}); await espera(600); }
  fallarSellar = false;
  await p.getByRole('button', { name: /Llévatelo/ }).click({ force: true }).catch(() => {}); await espera(3000);
  const pasos = sql(`select string_agg(clave, ',') from pasos p join credenciales c on c.id = p.credencial_id where c.codigo = '${nuevo}' and sello = 2`);
  const ganado2 = await p.evaluate(() => JSON.parse(sessionStorage.getItem('sd:jugador') || 'null'));
  console.log('5. Otra vez «Llévatelo», con la base bien → paso en la base:', pasos || '(ninguno)', '| ganado:', JSON.stringify(ganado2 && ganado2.ganado), '| timbre en el HUB:', sql(`select count(*) from eventos where tipo = 'timbre' and codigo = '${nuevo}' and datos->>'sello' = '2'`));
  console.log('errores de página:', errores.length ? errores : 'ninguno');
  await b.close();
})();
