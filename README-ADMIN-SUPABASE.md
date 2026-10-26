# Atithi Admin Supabase setup

The admin client uses only `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` from the local `.env`. Admin sign-in is persisted under its isolated `atithi-admin-auth` storage key. Never put a service-role or secret key in the frontend or `.env` file.

Create the initial super administrator in Supabase Authentication (email `admin@atithi.com`), then insert a matching `admin_profiles` row using that Auth user's UUID as `id`, their name and email, and `role = 'super_admin'`. Ensure your existing admin RLS policies allow the authenticated admins to read and manage the existing tables.

Deploy the privileged account-management functions from the repository root:

```sh
supabase login
supabase link --project-ref gbtojcaaxrbexhksfxuj
supabase functions deploy create-admin
supabase functions deploy update-admin
supabase functions deploy delete-admin
```

Supabase injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions. Do not add those values to frontend environment files.
