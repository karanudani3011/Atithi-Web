import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return respond({ error: 'Please sign in as an admin first.' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return respond({ error: 'Server configuration is incomplete.' }, 500);
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return respond({ error: 'Your session expired. Please sign in again.' }, 401);

  let body: { id?: unknown };
  try { body = await request.json(); } catch { return respond({ error: 'Request body valid JSON hovu joiye.' }, 400); }
  const id = String(body.id || '');
  if (!id) return respond({ error: 'Team member ID missing che.' }, 400);
  if (id === authData.user.id) return respond({ error: 'Tame tamaro access remove nahi kari shako.' }, 403);

  const { data: caller, error: callerError } = await supabase.from('admin_profiles')
    .select('role,is_active').eq('id', authData.user.id).maybeSingle();
  if (callerError || caller?.role !== 'admin' || caller?.is_active !== true) return respond({ error: 'Access denied.' }, 403);

  const { data: target, error: targetError } = await supabase.from('admin_profiles')
    .select('id').eq('id', id).maybeSingle();
  if (targetError || !target) return respond({ error: 'Team member not found.' }, 404);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
  if (deleteError) {
    const lastAdmin = /last active admin/i.test(deleteError.message);
    return respond({ error: lastAdmin ? 'Last active admin remove nahi thai shake.' : 'Team member remove na thayu.' }, lastAdmin ? 409 : 500);
  }
  return respond({ success: true });
});



