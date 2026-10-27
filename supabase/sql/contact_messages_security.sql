-- Public contact form inserts; only active admins may read, edit, or delete messages.
BEGIN;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.contact_messages FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.contact_messages TO authenticated;

-- Remove earlier policies so no permissive policy can grant anonymous reads.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_messages'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.contact_messages', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY contact_messages_public_insert
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(name)) BETWEEN 1 AND 100
    AND char_length(btrim(email)) BETWEEN 3 AND 254
    AND email = btrim(email)
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND (phone IS NULL OR char_length(phone) <= 50)
    AND char_length(btrim(message)) BETWEEN 1 AND 3000
  );

CREATE POLICY contact_messages_admin_select
  ON public.contact_messages FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY contact_messages_admin_update
  ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY contact_messages_admin_delete
  ON public.contact_messages FOR DELETE TO authenticated
  USING (public.is_admin());

-- Add the table to Realtime only if it is not already published.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
  END IF;
END $$;

COMMIT;
