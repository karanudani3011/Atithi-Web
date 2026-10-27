-- Shared room-type catalog. Run after the access_management.sql migration.
BEGIN;

CREATE TABLE IF NOT EXISTS public.room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NULL,
  description text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_types_name_length_check CHECK (char_length(name) BETWEEN 1 AND 60)
);

ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS slug text NULL;
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS description text NULL;
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.room_types'::regclass AND conname = 'room_types_name_length_check'
  ) THEN
    ALTER TABLE public.room_types
      ADD CONSTRAINT room_types_name_length_check CHECK (char_length(name) BETWEEN 1 AND 60);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS room_types_name_lower_unique ON public.room_types (lower(name));

-- Candidate duplicate report: names that differ only by a trailing "Room".
-- Review these rows manually before deciding whether to rename/merge anything.
SELECT normalized_name, array_agg(DISTINCT display_name ORDER BY display_name) AS possible_duplicates
FROM (
  SELECT DISTINCT trim(room_type) AS display_name,
    regexp_replace(lower(trim(room_type)), '\s+room$', '', 'i') AS normalized_name
  FROM public.rooms
  WHERE room_type IS NOT NULL AND nullif(trim(room_type), '') IS NOT NULL
) candidates
GROUP BY normalized_name
HAVING count(DISTINCT lower(display_name)) > 1
ORDER BY normalized_name;

-- Seed every currently used text value. No names are silently merged or renamed.
INSERT INTO public.room_types (name)
SELECT DISTINCT trim(room_type)
FROM public.rooms
WHERE room_type IS NOT NULL AND nullif(trim(room_type), '') IS NOT NULL
ON CONFLICT DO NOTHING;

-- Preserve the existing text field, and add the nullable FK for new writes.
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_type_id uuid NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.rooms'::regclass AND conname = 'rooms_room_type_id_fkey'
  ) THEN
    ALTER TABLE public.rooms
      ADD CONSTRAINT rooms_room_type_id_fkey
      FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE RESTRICT;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS rooms_room_type_id_idx ON public.rooms(room_type_id);

UPDATE public.rooms AS room
SET room_type_id = type.id
FROM public.room_types AS type
WHERE room.room_type_id IS NULL
  AND room.room_type IS NOT NULL
  AND lower(trim(room.room_type)) = lower(type.name);

CREATE OR REPLACE FUNCTION public.sync_room_type_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE canonical_name text;
DECLARE canonical_id uuid;
BEGIN
  IF NEW.room_type_id IS NOT NULL THEN
    SELECT name INTO canonical_name FROM public.room_types WHERE id = NEW.room_type_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected room type no longer exists.' USING ERRCODE = '23503';
    END IF;
    NEW.room_type := canonical_name;
  ELSIF NEW.room_type IS NOT NULL AND nullif(trim(NEW.room_type), '') IS NOT NULL THEN
    SELECT id, name INTO canonical_id, canonical_name
    FROM public.room_types WHERE lower(name) = lower(trim(NEW.room_type)) LIMIT 1;
    IF FOUND THEN
      NEW.room_type_id := canonical_id;
      NEW.room_type := canonical_name;
    ELSE NEW.room_type := trim(NEW.room_type);
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rooms_sync_room_type_text ON public.rooms;
CREATE TRIGGER rooms_sync_room_type_text
BEFORE INSERT OR UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.sync_room_type_text();

CREATE OR REPLACE FUNCTION public.sync_room_text_after_type_rename()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.rooms SET room_type = NEW.name WHERE room_type_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS room_types_sync_room_text_after_rename ON public.room_types;
CREATE TRIGGER room_types_sync_room_text_after_rename
AFTER UPDATE OF name ON public.room_types
FOR EACH ROW EXECUTE FUNCTION public.sync_room_text_after_type_rename();

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.room_types FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.room_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.room_types TO authenticated;

DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'room_types'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.room_types', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY room_types_anon_active_read
  ON public.room_types FOR SELECT TO anon
  USING (is_active = true);
CREATE POLICY room_types_authenticated_read
  ON public.room_types FOR SELECT TO authenticated
  USING (is_active = true OR public.is_admin());
CREATE POLICY room_types_admin_insert
  ON public.room_types FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY room_types_admin_update
  ON public.room_types FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY room_types_admin_delete
  ON public.room_types FOR DELETE TO authenticated
  USING (public.is_admin());

-- Optional Realtime publication for cross-tab catalog updates.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_types'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_types;
  END IF;
END $$;

COMMIT;
