// Manda un aviso (Web Push) a los celulares suscritos desde la credencial (plan 007).
// Solo la puede llamar el staff con su sesión. Deploy desde la raíz del repo:
//   supabase functions deploy notificar --workdir shared
// Secretos (Project Settings > Edge Functions > Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:correo@del.equipo)
// Las claves se generan una vez con: npx web-push generate-vapid-keys
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface Pedido { titulo: string; cuerpo: string; url?: string; codigo?: string | null }
interface Suscripcion { id: number; endpoint: string; p256dh: string; auth: string }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder({ error: 'metodo' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const autorizacion = req.headers.get('Authorization') ?? '';

  // 1. ¿Quién llama? Con la sesión del staff, es_staff() responde true.
  const comoUsuario = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: autorizacion } } });
  const { data: esStaff, error: errStaff } = await comoUsuario.rpc('es_staff');
  if (errStaff || !esStaff) return responder({ error: 'solo_staff' }, 403);
  const { data: quien } = await comoUsuario.auth.getUser();

  // 2. Qué mandar.
  let pedido: Pedido;
  try { pedido = await req.json(); } catch { return responder({ error: 'json' }, 400); }
  const titulo = (pedido.titulo ?? '').trim().slice(0, 80);
  const cuerpo = (pedido.cuerpo ?? '').trim().slice(0, 240);
  const enlace = (pedido.url ?? '').trim() || undefined;
  const codigo = pedido.codigo ? pedido.codigo.trim().toUpperCase() : null;
  if (!titulo || !cuerpo) return responder({ error: 'titulo_y_cuerpo' }, 400);
  if (codigo && !/^SD-[A-Z0-9]{5}$/.test(codigo)) return responder({ error: 'codigo' }, 400);

  // 3. A quién: todas las suscripciones o las de una credencial (con la service role: la tabla no es pública).
  const servicio = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let consulta = servicio.from('suscripciones_push').select('id, endpoint, p256dh, auth');
  if (codigo) {
    const { data: cred } = await servicio.from('credenciales').select('id').eq('codigo', codigo).maybeSingle();
    if (!cred) return responder({ error: 'credencial_no_existe' }, 404);
    consulta = consulta.eq('credencial_id', cred.id);
  }
  const { data: subs, error: errSubs } = await consulta;
  if (errSubs) return responder({ error: errSubs.message }, 500);

  // 4. Mandar. Las suscripciones vencidas (404/410) se borran.
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:somosdiseno@example.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const carga = JSON.stringify({ titulo, cuerpo, url: enlace });
  let enviadas = 0, fallidas = 0;
  const vencidas: number[] = [];
  await Promise.all(((subs ?? []) as Suscripcion[]).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 60 * 60 });
      enviadas++;
    } catch (e) {
      fallidas++;
      const estado = (e as { statusCode?: number }).statusCode;
      if (estado === 404 || estado === 410) vencidas.push(s.id);
    }
  }));
  if (vencidas.length) await servicio.from('suscripciones_push').delete().in('id', vencidas);

  // 5. Historial.
  await servicio.from('notificaciones').insert({ titulo, cuerpo, url: enlace ?? null, codigo, enviadas, fallidas, staff_id: quien?.user?.id ?? null });
  return responder({ enviadas, fallidas, vencidas: vencidas.length });
});
