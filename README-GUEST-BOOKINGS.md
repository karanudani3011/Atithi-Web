# Guest bookings

Run `supabase/sql/guest_browser_bookings.sql` in the Supabase SQL Editor after `guest_booking_ownership.sql`, then deploy the four `bookings-*` Edge Functions. Configure the Supabase Edge Function secrets `APP_ENV=production` and `WEB_ORIGIN=https://your-site.example` for production. The functions use `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`, which Supabase provides to Edge Functions.

The Vite development server proxies same-origin `/api/bookings` requests to the configured Supabase project. This lets the browser store the host-only `atithi_guest` cookie on localhost with `HttpOnly; SameSite=Lax`. Production hosting must provide the equivalent same-origin proxy mappings:

| Browser path | Supabase Function |
| --- | --- |
| `POST /api/bookings` | `bookings-create` |
| `GET /api/bookings/my` | `bookings-my` |
| `POST /api/bookings/cancel` | `bookings-cancel` |
| `POST /api/bookings/merge` | `bookings-merge` |

The prior email/reference lookup SQL function is removed by the migration. If its Edge Function was previously deployed, delete that deployment in the Supabase project as well; removing a local function directory does not delete a deployed function.
