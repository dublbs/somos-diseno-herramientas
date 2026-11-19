// Imita lo que usa el PC madre de Supabase (auth/v1/user, rest/v1 tablas y rpc) contra el Postgres local,
// como el rol authenticated con el usuario que se pase. Solo para pruebas.
const { execFileSync } = require('child_process');
const lit = v => v == null ? 'null' : typeof v === 'object' ? "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb" : "'" + String(v).replace(/'/g, "''") + "'";
const id = s => { if (!/^[a-z_]+$/.test(s)) throw new Error('nombre raro ' + s); return s; };
function psql(sub, sql) {
  return execFileSync('psql', ['-U', process.env.PGUSER || 'postgres', '-d', process.env.PGDB || 'qa', '-tAq', '-v', 'ON_ERROR_STOP=1', '-c',
    `set role authenticated; set request.jwt.claim.sub = '${sub}'; ${sql}`], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}
function filtros(q) {
  const w = [];
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
    if (k === 'or') continue; // búsqueda: no hace falta en la prueba
    const [op, ...r] = v.split('.'); const val = r.join('.');
    if (op === 'eq') w.push(`${id(k)} = ${lit(val)}`);
    else if (op === 'in') w.push(`${id(k)}::text in (${val.replace(/^\(|\)$/g, '').split(',').map(x => lit(x.replace(/^"|"$/g, ''))).join(',')})`);
    else if (op === 'gte') w.push(`${id(k)} >= ${lit(val)}`);
    else if (op === 'gt') w.push(`${id(k)} > ${lit(val)}`);
  }
  return w.length ? ' where ' + w.join(' and ') : '';
}
function responder(sub, user, metodo, url, cuerpo, cab) {
  const u = new URL(url); const q = u.searchParams; const p = u.pathname;
  if (p === '/auth/v1/user') return [200, user];
  let m = p.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/);
  try {
    if (m) {
      const fn = id(m[1]);
      const existe = psql(sub, `select prorettype::regtype from pg_proc where proname = ${lit(fn)} limit 1`);
      const conjunto = existe && psql(sub, `select proretset from pg_proc where proname = ${lit(fn)} limit 1`) === 't';
      if (!existe) return [404, { code: 'PGRST202', message: `Could not find the function public.${fn}` }];
      const args = JSON.parse(cuerpo || '{}');
      const llamada = `public.${fn}(${Object.entries(args).map(([k, v]) => `${id(k)} => ${lit(v)}`).join(', ')})`;
      if (conjunto) { const a = JSON.parse(cuerpo || '{}'); return [200, JSON.parse(psql(sub, `select coalesce(json_agg(x), '[]') from public.${fn}(${Object.entries(a).map(([k, v]) => `${id(k)} => ${lit(v)}`).join(', ')}) x`))]; }
      if (existe === 'void') { psql(sub, `select ${llamada}`); return [204, null]; }
      const out = psql(sub, `select coalesce(to_jsonb(${llamada}), 'null'::jsonb)`);
      return [200, JSON.parse(out)];
    }
    m = p.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (!m) return [404, { message: 'no' }];
    const t = id(m[1]);
    if (metodo === 'GET' || metodo === 'HEAD') {
      const cols = (q.get('select') || '*').split(',').map(c => c.trim() === '*' ? '*' : id(c.trim())).join(', ');
      let sql = `select ${cols} from public.${t}${filtros(q)}`;
      if (q.get('order')) sql += ' order by ' + q.get('order').split(',').map(o => { const [c, d] = o.split('.'); return `${id(c)} ${d === 'desc' ? 'desc' : 'asc'}`; }).join(', ');
      const rango = (cab['range'] || '').match(/(\d+)-(\d+)/);
      if (rango) sql += ` limit ${+rango[2] - +rango[1] + 1} offset ${+rango[1]}`;
      else { if (q.get('limit')) sql += ` limit ${+q.get('limit')}`; if (q.get('offset')) sql += ` offset ${+q.get('offset')}`; }
      const out = JSON.parse(psql(sub, `select coalesce(json_agg(x), '[]') from (${sql}) x`));
      if ((cab['accept'] || '').includes('vnd.pgrst.object')) return [200, out[0] ?? null];
      if (cab['prefer'] && cab['prefer'].includes('count=exact')) return [200, out, { 'content-range': `0-${out.length - 1}/${out.length}` }];
      return [200, out];
    }
    if (metodo === 'DELETE') { psql(sub, `delete from public.${t}${filtros(q)}`); return [204, null]; }
    if (metodo === 'POST') {
      const filas = [].concat(JSON.parse(cuerpo));
      for (const f of filas) {
        const ks = Object.keys(f).map(id);
        const conflicto = q.get('on_conflict') ? q.get('on_conflict').split(',').map(id) : null;
        const pk = conflicto || (t === 'config' ? ['clave'] : null);
        psql(sub, `insert into public.${t} (${ks.join(',')}) values (${ks.map(k => lit(f[k])).join(',')})` +
          (pk ? ` on conflict (${pk.join(',')}) do ${(cab['prefer'] || '').includes('ignore-duplicates') ? 'nothing' : 'update set ' + ks.map(k => `${k} = excluded.${k}`).join(', ')}` : ''));
      }
      return [201, null];
    }
    if (metodo === 'PATCH') {
      const f = JSON.parse(cuerpo);
      psql(sub, `update public.${t} set ${Object.keys(f).map(k => `${id(k)} = ${lit(f[k])}`).join(', ')}${filtros(q)}`);
      return [204, null];
    }
  } catch (e) {
    const msg = String(e.stderr || e.message || e).split('\n').find(l => l.includes('ERROR')) || String(e);
    return [400, { message: msg.replace(/^.*ERROR:\s*/, '').trim(), code: 'P0001' }];
  }
  return [405, { message: 'no' }];
}
module.exports = { responder };
