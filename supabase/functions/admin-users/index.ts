import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function authorize(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { error: 'Authentication required.', status: 401 } as const;
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const caller = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authError } = await caller.auth.getUser(token);
  if (authError || !user) return { error: 'Your session has expired. Please sign in again.', status: 401 } as const;
  const { data: isAdmin, error } = await caller.rpc('is_admin');
  if (error || isAdmin !== true) return { error: 'Admin access required.', status: 403 } as const;
  return { user, service: createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const auth = await authorize(req);
  if ('error' in auth) return json({ error: auth.error }, auth.status);

  try {
    const url = new URL(req.url);
    if (req.method === 'GET') {
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const perPage = 10;
      const search = (url.searchParams.get('search') || '').trim().replace(/[%,()]/g, '');
      let query = auth.service.from('users')
        .select('id,name,email,is_active,last_login_at,created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, error, count } = await query;
      if (error) return json({ error: 'Could not load users.' }, 500);
      const total = count || 0;
      return json({ data: data || [], pagination: { page, perPage, total, pages: Math.max(1, Math.ceil(total / perPage)) } });
    }

    if (req.method === 'PATCH') {
      const id = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) || '');
      if (!/^\d+$/.test(id)) return json({ error: 'A valid user ID is required.' }, 400);
      const body = await req.json();
      if (typeof body?.is_active !== 'boolean') return json({ error: 'is_active must be true or false.' }, 400);
      const { data: row, error: lookupError } = await auth.service.from('users').select('auth_id').eq('id', id).maybeSingle();
      if (lookupError || !row) return json({ error: 'User not found.' }, 404);
      if (row.auth_id === auth.user.id) return json({ error: 'You cannot block your own account.' }, 403);
      const { data, error } = await auth.service.from('users').update({ is_active: body.is_active }).eq('id', id)
        .select('id,name,email,is_active,last_login_at,created_at').single();
      if (error) return json({ error: 'Could not update this user.' }, 500);
      return json({ data });
    }
    return json({ error: 'Method not allowed.' }, 405);
  } catch {
    return json({ error: 'Could not complete the user request. Please try again.' }, 500);
  }
});
