-- Block 1: table grants needed by the app's signed-in client.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.admin_profiles, public.bookings, public.contact_messages, public.favorites, public.login_history, public.login_logs, public.profiles, public.properties, public.registered_users, public.room_types, public.rooms, public.services, public.wishlists FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_profiles, public.bookings, public.contact_messages, public.favorites, public.login_history, public.login_logs, public.profiles, public.properties, public.registered_users, public.room_types, public.rooms, public.services, public.wishlists TO authenticated;
GRANT SELECT ON TABLE public.rooms, public.room_types, public.services, public.properties TO anon, authenticated;
GRANT INSERT ON TABLE public.contact_messages TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Block 2: replace existing policies on the requested tables before applying this policy set.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY (ARRAY['admin_profiles','bookings','contact_messages','favorites','login_history','login_logs','profiles','properties','registered_users','room_types','rooms','services','wishlists'])
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Block 3: SECURITY DEFINER avoids recursive RLS checks while looking up admin membership.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
  SELECT COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR EXISTS (SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id::text = (SELECT auth.uid())::text AND ap.role = 'admin' AND ap.is_active IS TRUE);
$$;

-- Block 4: restrict helper execution to authenticated requests.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Block 5: enable RLS on every table named in the request.
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Block 6: admin full access to admin_profiles.
DROP POLICY IF EXISTS admin_all_admin_profiles ON public.admin_profiles;
CREATE POLICY admin_all_admin_profiles ON public.admin_profiles FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 7: allow an authenticated user to read their admin_profiles row during login verification.
DROP POLICY IF EXISTS admin_profiles_self_read ON public.admin_profiles;
CREATE POLICY admin_profiles_self_read ON public.admin_profiles FOR SELECT TO authenticated
USING (id::text = (SELECT auth.uid())::text);

-- Block 8: admin full access to bookings.
DROP POLICY IF EXISTS admin_all_bookings ON public.bookings;
CREATE POLICY admin_all_bookings ON public.bookings FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 9: users can access their own bookings.
DROP POLICY IF EXISTS owner_all_bookings ON public.bookings;
CREATE POLICY owner_all_bookings ON public.bookings FOR ALL TO authenticated
USING (user_id::text = (SELECT auth.uid())::text) WITH CHECK (user_id::text = (SELECT auth.uid())::text);

-- Block 10: admin full access to contact_messages.
DROP POLICY IF EXISTS admin_all_contact_messages ON public.contact_messages;
CREATE POLICY admin_all_contact_messages ON public.contact_messages FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 11: allow anyone to submit a contact message.
DROP POLICY IF EXISTS anyone_insert_contact_messages ON public.contact_messages;
CREATE POLICY anyone_insert_contact_messages ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Block 12: admin full access to favorites.
DROP POLICY IF EXISTS admin_all_favorites ON public.favorites;
CREATE POLICY admin_all_favorites ON public.favorites FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 13: users can access their own favorites.
DROP POLICY IF EXISTS owner_all_favorites ON public.favorites;
CREATE POLICY owner_all_favorites ON public.favorites FOR ALL TO authenticated
USING (user_id::text = (SELECT auth.uid())::text) WITH CHECK (user_id::text = (SELECT auth.uid())::text);

-- Block 14: admin full access to wishlists.
DROP POLICY IF EXISTS admin_all_wishlists ON public.wishlists;
CREATE POLICY admin_all_wishlists ON public.wishlists FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 15: users can access their own wishlists.
DROP POLICY IF EXISTS owner_all_wishlists ON public.wishlists;
CREATE POLICY owner_all_wishlists ON public.wishlists FOR ALL TO authenticated
USING (user_id::text = (SELECT auth.uid())::text) WITH CHECK (user_id::text = (SELECT auth.uid())::text);

-- Block 16: admin full access to login_history.
DROP POLICY IF EXISTS admin_all_login_history ON public.login_history;
CREATE POLICY admin_all_login_history ON public.login_history FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 17: admin full access to login_logs.
DROP POLICY IF EXISTS admin_all_login_logs ON public.login_logs;
CREATE POLICY admin_all_login_logs ON public.login_logs FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 18: admin full access to profiles.
DROP POLICY IF EXISTS admin_all_profiles ON public.profiles;
CREATE POLICY admin_all_profiles ON public.profiles FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 19: admin full access to properties.
DROP POLICY IF EXISTS admin_all_properties ON public.properties;
CREATE POLICY admin_all_properties ON public.properties FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 20: admin full access to registered_users.
DROP POLICY IF EXISTS admin_all_registered_users ON public.registered_users;
CREATE POLICY admin_all_registered_users ON public.registered_users FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 21: admin full access to room_types.
DROP POLICY IF EXISTS admin_all_room_types ON public.room_types;
CREATE POLICY admin_all_room_types ON public.room_types FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 22: admin full access to rooms.
DROP POLICY IF EXISTS admin_all_rooms ON public.rooms;
CREATE POLICY admin_all_rooms ON public.rooms FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Block 23: admin full access to services.
DROP POLICY IF EXISTS admin_all_services ON public.services;
CREATE POLICY admin_all_services ON public.services FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));


-- Block 25: public read access to rooms.
DROP POLICY IF EXISTS public_read_rooms ON public.rooms;
CREATE POLICY public_read_rooms ON public.rooms FOR SELECT TO anon, authenticated USING (true);

-- Block 26: public read access to room_types.
DROP POLICY IF EXISTS public_read_room_types ON public.room_types;
CREATE POLICY public_read_room_types ON public.room_types FOR SELECT TO anon, authenticated USING (true);

-- Block 27: public read access to services.
DROP POLICY IF EXISTS public_read_services ON public.services;
CREATE POLICY public_read_services ON public.services FOR SELECT TO anon, authenticated USING (true);

-- Block 28: public read access to properties.
DROP POLICY IF EXISTS public_read_properties ON public.properties;
CREATE POLICY public_read_properties ON public.properties FOR SELECT TO anon, authenticated USING (true);

NOTIFY pgrst, 'reload schema';




