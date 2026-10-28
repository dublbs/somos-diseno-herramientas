// Borra tarjetas vencidas (archivo + fila). Se programa cada hora con pg_cron.
// Deploy: supabase functions deploy limpiar
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async () => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: vencidas } = await sb.from('fotomaton').select('id, ruta').lt('expira', new Date().toISOString());
  if (!vencidas?.length) return new Response(JSON.stringify({ borradas: 0 }));
  await sb.storage.from('fotomaton').remove(vencidas.map(v => v.ruta));
  await sb.from('fotomaton').delete().in('id', vencidas.map(v => v.id));
  return new Response(JSON.stringify({ borradas: vencidas.length }));
});
