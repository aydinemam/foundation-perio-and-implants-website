# Backend & Deployment Setup

This site uses [Supabase](https://supabase.com) (free tier) as the backend — no server to run yourself. Forms write directly to a database, and `admin.html` is a password-protected dashboard for viewing them. It deploys automatically to GitHub Pages via GitHub Actions.

## 1. Create a Supabase project
Sign up at supabase.com and create a new project (pick any name/region/password — you won't need the database password day-to-day).

## 2. Run the schema
In the Supabase dashboard: **SQL Editor → New query**, paste the contents of [`schema.sql`](schema.sql), and run it. This creates three tables (`leads`, `appointment_requests`, `page_views`) and locks them down so the public site can only *submit* forms, never read them.

## 3. Create the office login
**Authentication → Users → Add user** — create one email/password login for the office (e.g. Dr. Emam or front-desk staff). This is the only account that can sign in to `admin.html`.

## 4. Add your Supabase credentials as repository secrets
**Project Settings → API** in Supabase — copy the **Project URL** and **anon public** key.

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**, and add two:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

These are injected into `js/supabase-config.js` at deploy time by `.github/workflows/deploy.yml` — the real values are never committed to the repo. (The anon key is safe to expose in a deployed site regardless — Row Level Security is what actually protects the data — but keeping it out of committed source is still good practice.)

## 5. Turn on GitHub Pages
**Settings → Pages → Build and deployment → Source: GitHub Actions.** That's it — the workflow handles the rest.

## 6. Deploy
Every push to `main` triggers the Actions workflow, which builds a copy of the site with the real Supabase config injected and publishes it to GitHub Pages. Check the **Actions** tab for build status and the live URL (`https://<username>.github.io/<repo-name>/`).

For local testing before pushing, you can temporarily fill in real values in `js/supabase-config.js` — just don't commit that change (or revert it before pushing).

## 7. Use the dashboard
Visit `<your-site>/admin.html`, sign in with the login from step 3, and you'll see appointment requests, contact leads, and a 7-day page view count — with status dropdowns and delete buttons for each entry.

---

**Scope note:** these tables are for contact/scheduling info only (name, phone, email, requested service, preferred time). Never enter actual patient health/clinical information into this system — that requires a HIPAA-compliant tool instead.
