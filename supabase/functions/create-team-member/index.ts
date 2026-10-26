import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return respond({ error: 'Please sign in as an admin first.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return respond({ error: 'Server configuration is incomplete.' }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const caller = authData?.user;
  if (authError || !caller) return respond({ error: 'Your session expired. Please sign in again.' }, 401);

  const { data: callerProfile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('id,role,is_active')
    .eq('id', caller.id)
    .maybeSingle();
  if (profileError || callerProfile?.role !== 'admin' || callerProfile?.is_active !== true) {
    return respond({ error: 'Access denied. Fakat active admin team members add kari shake.' }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return respond({ error: 'Request body valid JSON hovu joiye.' }, 400); }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = String(body.role || '');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name) return respond({ error: 'Name jaruri che.' }, 400);
  if (!validEmail) return respond({ error: 'Valid email address lakho.' }, 400);
  if (password.length < 8) return respond({ error: 'Password minimum 8 characters nu hovu joiye.' }, 400);
  if (!['admin', 'staff'].includes(role)) return respond({ error: 'Role admin athva staff hovu joiye.' }, 400);

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created?.user) {
    const duplicate = /already|registered|exists/i.test(createError?.message || '');
    return respond({ error: duplicate ? 'Aa email par account pehlethi che.' : 'Account create na thayu. Please try again.' }, duplicate ? 409 : 400);
  }

  const { data: profile, error: insertError } = await supabase
    .from('admin_profiles')
    .insert({
      id: created.user.id,
      name,
      email,
      role,
      is_active: true,
      created_by: caller.id,
    })
    .select('id,name,email,role,is_active,created_at,created_by')
    .single();

  if (insertError || !profile) {
    const { error: rollbackError } = await supabase.auth.admin.deleteUser(created.user.id);
    if (rollbackError) console.error('New Auth user rollback failed', rollbackError);
    const duplicate = /duplicate|unique/i.test(insertError?.message || '');
    return respond({ error: duplicate ? 'Aa email team access ma pehlethi che.' : 'Profile save na thayu; account rollback kari didhu.' }, duplicate ? 409 : 500);
  }

  return respond({ data: profile }, 201);
});
