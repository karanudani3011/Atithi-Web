import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const authorization = request.headers.get('Authorization'); if (!authorization?.startsWith('Bearer ')) return json({ error: 'Please sign in as a super admin.' }, 401);
    const client = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
    const { data: authData, error: authError } = await client.auth.getUser(authorization.slice(7)); if (authError || !authData.user) return json({ error: 'Your admin session is invalid.' }, 401);
    const { data: caller } = await client.from('admin_profiles').select('role').eq('id', authData.user.id).maybeSingle(); if (caller?.role !== 'super_admin') return json({ error: 'Only a super admin can revoke administrator accounts.' }, 403);
    const { id } = await request.json(); if (!id || id === authData.user.id) return json({ error: 'You cannot revoke this account.' }, 400);
    const { data: target } = await client.from('admin_profiles').select('*').eq('id', id).maybeSingle(); if (!target || target.role !== 'sub_admin') return json({ error: 'Sub-admin account not found.' }, 404);
    const { error: profileError } = await client.from('admin_profiles').delete().eq('id', id); if (profileError) return json({ error: profileError.message }, 500);
    const { error } = await client.auth.admin.deleteUser(id); if (error) { await client.from('admin_profiles').insert(target); return json({ error: error.message }, 400); }
    return json({ success: true });
  } catch (error) { return json({ error: error.message || 'Could not revoke the admin account.' }, 500); }
});
