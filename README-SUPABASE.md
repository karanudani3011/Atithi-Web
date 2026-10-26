# Atithi Supabase setup

## Local app

Create a `.env` file in the project root with the project URL and public anon key:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

These are public browser configuration values. Never put a service role key in a `VITE_` variable or any frontend file. The database tables, RPC functions, storage buckets, and row-level security policies are expected to exist already.

## Deploy the admin Edge Functions

Install and authenticate the Supabase CLI, link this project, then deploy both functions:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-admin
supabase functions deploy delete-admin
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Set the function secret only through the Supabase CLI/dashboard secrets manager. It is read only inside the Edge Functions. The functions validate the caller's JWT and require a `super_admin` profile before they create or revoke a sub-admin.

## Storage and database behavior

- `rooms` is loaded from Supabase; room photos and gallery images upload to the public `room-images` bucket.
- Guest photo and ID files upload to the private `guest-docs` bucket. Admin detail links are signed for 60 seconds.
- Guest reservations are submitted through the `create_booking` RPC; booking reads and changes use the protected admin session and existing RLS policies.
- The app requires working RLS policies that let an authenticated admin read its own profile and let authorized admins read admin profiles, rooms, and bookings as appropriate.
