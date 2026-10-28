// Devuelve una URL firmada corta para /f/:id. Deploy: supabase functions deploy tarjeta
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== 'string' || !UUID.test(id)) return json({ error: 'id inválido' }, 400);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: fila } = await sb.from('fotomaton').select('ruta, expira').eq('id', id).maybeSingle();
  if (!fila || new Date(fila.expira) < new Date()) return json({ error: 'no existe o expiró' }, 404);
  const { data } = await sb.storage.from('fotomaton').createSignedUrl(fila.ruta, 60);
  if (!data) return json({ error: 'sin archivo' }, 404);
  return json({ url: data.signedUrl, expira: fila.expira });
});
