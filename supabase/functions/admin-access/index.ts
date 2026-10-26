import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function authorize(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { error: 'Authentication required.', status: 401 } as const;
  const url = Deno.env.get('SUPABASE_URL')!;
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: `Bearer ${token}` } } });
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
    const id = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) || '');
    if (req.method === 'GET') {
      const { data, error } = await auth.service.from('admin_profiles')
        .select('id,name,email,role,is_active,last_login_at,created_at').order('created_at', { ascending: false });
      if (error) return json({ error: 'Could not load access holders.' }, 500);
      return json({ data: data || [] });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const name = String(body?.name || '').trim();
      const email = String(body?.email || '').trim().toLowerCase();
      const password = String(body?.password || '');
      const role = String(body?.role || 'admin');
      if (!name || !emailPattern.test(email) || password.length < 8 || !['admin', 'staff'].includes(role)) {
        return json({ error: 'Enter a name, valid email, password of at least 8 characters, and role Admin or Staff.' }, 400);
      }
      const { data, error } = await auth.service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
      if (error) return json({ error: /already/i.test(error.message) ? 'An account with this email already exists.' : 'Could not create access.' }, /already/i.test(error.message) ? 409 : 400);
      const { data: profile, error: insertError } = await auth.service.from('admin_profiles')
        .insert({ id: data.user.id, name, email, role, is_active: true })
        .select('id,name,email,role,is_active,last_login_at,created_at').single();
      if (insertError) {
        await auth.service.auth.admin.deleteUser(data.user.id);
        return json({ error: 'Could not save the access role.' }, 500);
      }
      return json({ data: profile }, 201);
    }

    if (req.method === 'PATCH') {
      if (!id) return json({ error: 'Access holder ID is required.' }, 400);
      if (id === auth.user.id) return json({ error: 'You cannot revoke your own access.' }, 403);
      const body = await req.json();
      const updates: Record<string, unknown> = {};
      if (body?.role !== undefined) {
        if (!['admin', 'staff'].includes(body.role)) return json({ error: 'Role must be Admin or Staff.' }, 400);
        updates.role = body.role;
      }
      if (body?.is_active !== undefined) {
        if (typeof body.is_active !== 'boolean') return json({ error: 'is_active must be true or false.' }, 400);
        updates.is_active = body.is_active;
      }
      const { data: target, error: lookupError } = await auth.service.from('admin_profiles').select('id').eq('id', id).maybeSingle();
      if (lookupError || !target) return json({ error: 'Access holder not found.' }, 404);
      if (!Object.keys(updates).length) return json({ error: 'No changes provided.' }, 400);
      const { data, error } = await auth.service.from('admin_profiles').update(updates).eq('id', id)
        .select('id,name,email,role,is_active,last_login_at,created_at').single();
      if (error) return json({ error: 'Could not update the access holder.' }, 500);
      return json({ data });
    }
    return json({ error: 'Method not allowed.' }, 405);
  } catch {
    return json({ error: 'Could not complete the access request. Please try again.' }, 500);
  }
});
