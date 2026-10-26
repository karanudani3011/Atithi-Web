import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const authorization = request.headers.get('Authorization'); if (!authorization?.startsWith('Bearer ')) return json({ error: 'Please sign in as a super admin.' }, 401);
    const client = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
    const { data: authData, error: authError } = await client.auth.getUser(authorization.slice(7)); if (authError || !authData.user) return json({ error: 'Your admin session is invalid.' }, 401);
    const { data: caller, error: callerError } = await client.from('admin_profiles').select('role').eq('id', authData.user.id).maybeSingle();
    if (callerError || caller?.role !== 'super_admin') return json({ error: 'Only a super admin can create administrator accounts.' }, 403);
    const { name, email, password } = await request.json(); if (!name?.trim() || !email?.trim() || !password || password.length < 6) return json({ error: 'Name, valid email, and a password of at least 6 characters are required.' }, 400);
    if (email.trim().toLowerCase() === 'admin@atithi.com' || email.trim().toLowerCase() === authData.user.email?.toLowerCase()) return json({ error: 'That email is reserved for an administrator.' }, 400);
    const { data: created, error: createError } = await client.auth.admin.createUser({ email: email.trim().toLowerCase(), password, email_confirm: true, user_metadata: { name: name.trim() } });
    if (createError) return json({ error: createError.message }, 400);
    const { error: profileError } = await client.from('admin_profiles').insert({ id: created.user.id, name: name.trim(), email: email.trim().toLowerCase(), role: 'sub_admin' });
    if (profileError) { await client.auth.admin.deleteUser(created.user.id); return json({ error: profileError.message }, 400); }
    return json({ id: created.user.id, name: name.trim(), email: email.trim().toLowerCase(), role: 'sub_admin' }, 201);
  } catch (error) { return json({ error: error.message || 'Could not create the admin account.' }, 500); }
});
