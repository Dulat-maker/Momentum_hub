# Momentum Hub

A community hub for FTC teams: one account per team, a shared event calendar
that teams fill in themselves, team profiles with rosters, and a community board
with likes and feedback.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Supabase
(Postgres + Auth + Row Level Security).

---

## What is in it

| Area | What it does |
| --- | --- |
| **Accounts** | One login per FTC team, keyed to the team number. Email + password via Supabase Auth. |
| **Events** | Any team can publish an event: city, venue, format (in person / online / hybrid), kind (competition, scrimmage, workshop, outreach, meetup), start and end time, spots, cost, registration link. |
| **Filters** | Search plus filters by city, format, kind and upcoming / past. |
| **Likes** | One like per team per event, so hosts can see real interest. |
| **Feedback** | One review per team per event, with an optional 1-5 star rating. Averages shown on the event page. |
| **Teams** | Public profile per team: number, name, city, school, story, logo, links and roster. |
| **Community** | Posts by category (general, help wanted, showcase, announcement, looking for) with replies and likes. |
| **Dashboard** | Each team edits its own profile, roster, events and posts in one place. |

Every table is readable by everyone and writable only by the team that owns the
row — enforced in Postgres with RLS, not just in the UI.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Supabase project

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**.
   It creates the tables, indexes, the sign-up trigger and all RLS policies, and
   it is safe to run again later.
3. Press **Connect** at the top of the dashboard → **Framework** → **Next.js**,
   and copy the values from the `.env.local` tab. (The same values live under
   **Project Settings → API Keys**.)

### 3. Add the keys

Put them in `.env.local` (the file is already there, just fill it in):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Supabase renamed this key. Newer projects hand out `sb_publishable_...` as
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; older ones hand out an `anon public`
JWT as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Either name works** — the app checks
for both, so paste whichever your project gives you.

Only the publishable/anon key belongs here. Never commit a service-role or
`sb_secret_...` key, and never put one in a `NEXT_PUBLIC_*` variable — those are
shipped to the browser. The public key is safe there: access is controlled by
the RLS policies in `schema.sql`, not by keeping the key hidden.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000. Until the keys are filled in, the data pages show a
short "connect Supabase" card instead of crashing.

### 5. Email confirmation (optional, but do this while testing)

By default Supabase emails every new account a confirmation link. While you are
testing it is easier to turn that off: **Authentication → Sign In / Providers →
Email → Confirm email → off**. Turn it back on before you share the site.

If you leave it on, add your deployed URL under **Authentication → URL
Configuration → Redirect URLs** as `https://your-site/auth/callback` so the link
in the email lands back on the site.

---

## Deploying

The project runs on any Node host; Vercel is the least work:

1. Push the repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). Next.js is detected
   automatically — leave the build settings alone.
3. **Before the first deploy**, add the two environment variables from
   `.env.local` under *Environment Variables*, for all environments.
   `NEXT_PUBLIC_*` values are baked into the bundle at build time, so adding
   them later means triggering a fresh deploy (Deployments → ⋯ → Redeploy).
4. In Supabase, open **Authentication → URL Configuration**: set **Site URL**
   to the deployed address and add `https://your-site/auth/callback` under
   **Redirect URLs**. Without this, confirmation links in sign-up emails point
   back at localhost.
5. Turn **Confirm email** back on if you switched it off while testing, so
   nobody can claim another team's number with an address they do not own.

The built-in Supabase mailer is rate limited to a handful of messages per hour
and is meant for development. Before real teams start signing up, connect your
own SMTP under **Authentication → Emails** (Resend and Brevo both have free
tiers).

---

## How it is put together

```
src/
  app/
    page.tsx                  landing page
    events/                   list, detail, new, edit
    teams/                    directory and public team profiles
    community/                board and post pages
    dashboard/                the signed-in team's own area
    login/  signup/           auth pages
    auth/callback/route.ts    Supabase email-confirmation handler
  components/                 UI: cards, forms, filters, icons
  lib/
    actions/                  server actions (auth, events, teams, community)
    supabase/                 server, browser and session clients
    queries.ts                shared select strings and small read helpers
    types.ts                  row types and label maps
    format.ts  datetime.ts    date formatting, all in one timezone
  proxy.ts                    refreshes the Supabase session on every request
supabase/schema.sql           the entire database
```

A few decisions worth knowing:

- **One account == one team.** `teams.id` *is* the Supabase auth user id, so
  there is no separate join table and no way for a team to own two profiles. A
  Postgres trigger creates the profile row from the sign-up metadata.
- **All writes go through server actions** in `src/lib/actions/`. They validate
  input, then let RLS have the final say.
- **Times are stored as UTC** and rendered in one fixed timezone
  (`SITE_TIMEZONE` in `src/lib/format.ts`, currently `Asia/Almaty`), so the
  server and the browser never disagree about what a date says.
- **Logos are URLs**, not uploads, to keep Supabase Storage out of the setup. If
  you want real uploads later, add a public bucket and swap the `logo_url`
  field for an upload control.

---

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

---

## Быстрый старт (RU)

1. `npm install`
2. Создать проект на [supabase.com](https://supabase.com/dashboard), в SQL Editor
   вставить и запустить файл `supabase/schema.sql`.
3. Скопировать **Project URL** и **anon public** ключ из Project Settings → API
   в файл `.env.local`.
4. В Supabase выключить подтверждение email на время тестов:
   Authentication → Sign In / Providers → Email → Confirm email → off.
5. `npm run dev` и открыть http://localhost:3000.

Регистрация — одна учётка на команду, по номеру команды FTC. После входа
команда может добавлять ивенты, заполнять состав и писать в комьюнити.

---

Built by Momentum, an FTC team, for the teams around us.
