-- Atithi team access schema. Safe to rerun.
alter table public.admin_profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Convert the previous role labels, if present, before enforcing the two-role model.
do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname from pg_constraint
    where conrelid = 'public.admin_profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.admin_profiles drop constraint %I', constraint_row.conname);
  end loop;
end $$;

update public.admin_profiles
set role = case role
  when 'super_admin' then 'admin'
  when 'sub_admin' then 'staff'
  else role
end
where role in ('super_admin', 'sub_admin');

alter table public.admin_profiles
  add constraint admin_profiles_role_check check (role in ('admin', 'staff'));

create unique index if not exists admin_profiles_email_lower_unique
  on public.admin_profiles (lower(email));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select exists (
    select 1 from public.admin_profiles ap
    where ap.id = auth.uid() and ap.role = 'admin' and ap.is_active = true
  );
$$;

create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select exists (
    select 1 from public.admin_profiles ap
    where ap.id = auth.uid() and ap.role in ('admin', 'staff') and ap.is_active = true
  );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_team_member() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_team_member() to authenticated;

-- Remove every existing policy so no permissive legacy policy remains alongside these rules.
do $$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'admin_profiles'
  loop
    execute format('drop policy if exists %I on public.admin_profiles', policy_row.policyname);
  end loop;
end $$;

alter table public.admin_profiles enable row level security;

create policy admin_profiles_team_read
  on public.admin_profiles for select to authenticated
  using (public.is_team_member());

create policy admin_profiles_admin_update
  on public.admin_profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_profiles_admin_delete
  on public.admin_profiles for delete to authenticated
  using (public.is_admin());
-- Deliberately no client INSERT policy. Creation uses the protected Edge Function.

create or replace function public.protect_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  active_admin_count integer;
  removes_admin boolean;
begin
  -- Serialize admin-removal operations to prevent concurrent requests from removing the last admin.
  perform pg_advisory_xact_lock(710204, 1);

  if tg_op = 'DELETE' then
    if auth.uid() = old.id then
      raise exception using errcode = '42501', message = 'You cannot remove your own team access.';
    end if;
    removes_admin := old.role = 'admin' and old.is_active;
  else
    if auth.uid() = old.id and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
      raise exception using errcode = '42501', message = 'You cannot change your own role or active status.';
    end if;
    removes_admin := old.role = 'admin' and old.is_active
      and (new.role <> 'admin' or not new.is_active);
  end if;

  if removes_admin then
    select count(*) into active_admin_count
    from public.admin_profiles
    where role = 'admin' and is_active = true;

    if active_admin_count <= 1 then
      raise exception using
        errcode = '23514',
        message = 'The last active admin cannot be removed, disabled, or changed to staff.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists admin_profiles_protect_last_active_admin on public.admin_profiles;
create trigger admin_profiles_protect_last_active_admin
  before update of role, is_active or delete on public.admin_profiles
  for each row execute function public.protect_last_active_admin();

