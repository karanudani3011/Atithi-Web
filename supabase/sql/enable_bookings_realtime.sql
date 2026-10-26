-- Enable admin live refresh tables in Supabase Realtime; safe to run more than once.
DO $$
DECLARE table_to_add text;
BEGIN
  FOREACH table_to_add IN ARRAY ARRAY['bookings', 'rooms', 'contact_messages', 'users'] LOOP
    IF to_regclass(format('public.%I', table_to_add)) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=table_to_add
       ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_to_add);
    END IF;
  END LOOP;
END $$;

-- Verify that authenticated owners and active admins/staff can SELECT bookings.
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname='public' AND tablename='bookings'
ORDER BY policyname;
