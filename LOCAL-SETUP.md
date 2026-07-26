# Running Cognify Locally (Windows)

Verified end-to-end: `bun install` → `bun run build` → `bun run dev` all succeed, and
`/` and `/login` return HTTP 200.

Target folder in these instructions: `C:\Users\User\Desktop\sandeep`

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ (22 recommended) | https://nodejs.org |
| Bun | 1.3+ | **Recommended.** `powershell -c "irm bun.sh/install.ps1 | iex"` |
| Git | any | https://git-scm.com |

> **Use Bun, not npm.** The project ships a `bun.lock`, and `npm install` currently
> fails to install the platform-specific `lightningcss` native binary that Tailwind v4
> needs, producing `Error: Cannot find module '../lightningcss.win32-x64-msvc.node'`
> during the build. See the troubleshooting section if you must use npm.

## 2. Clone

```powershell
cd C:\Users\User\Desktop\sandeep
git clone https://github.com/saxdy7/cognify.git
cd cognify
```

If the folder already contains the repo, just `cd cognify` and `git pull origin main`.

## 3. Install dependencies

```powershell
bun install
```

## 4. Configure environment variables

Create `.env.local` in the project root (same folder as `package.json`):

```powershell
copy .env.example .env.local
notepad .env.local
```

Fill in real values from your Supabase project
(**Supabase Dashboard → Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>

SUPABASE_SERVICE_ROLE_KEY=<service role key>
DATABASE_URL=postgresql://postgres:<password>@db.<your-project-ref>.supabase.co:5432/postgres
```

- `NEXT_PUBLIC_*` values are inlined into the browser bundle — that is expected.
- `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only. Never prefix them
  with `NEXT_PUBLIC_`, and never commit `.env.local` (it is already gitignored).

The app **starts without these**, but auth and all data features will fail:
`middleware.ts` fails open when the vars are missing, and `src/lib/supabase.ts`
throws `Missing Supabase env vars` the first time the browser client is used.

## 5. Set up the database

In the Supabase SQL Editor, run these files from the repo root, in this order:

1. `supabase-canvas-schema.sql`
2. `supabase-notes-schema.sql`
3. `supabase-password-schema.sql`
4. `supabase-rls-policies.sql`

Then, in **Authentication → URL Configuration**, add
`http://localhost:3000/auth/callback` as a redirect URL so email/OAuth login works
against your local server.

## 6. Run

```powershell
bun run dev
```

Open http://localhost:3000. Sign up or log in at `/login`, and you land on `/dashboard`.

Other scripts:

```powershell
bun run build   # production build
bun run start   # serve the production build
bun run lint    # eslint
```

---

## Troubleshooting

**`Cannot find module '../lightningcss.win32-x64-msvc.node'`**
npm skipped the optional native package. Fix with Bun:
```powershell
rmdir /s /q node_modules
bun install
```
Or, if you're committed to npm:
```powershell
rmdir /s /q node_modules
del package-lock.json
npm install --include=optional
```

**`Missing Supabase env vars` in the browser console**
`.env.local` is missing, in the wrong folder, or the dev server wasn't restarted after
editing it. Next.js only reads env files at startup — stop and re-run `bun run dev`.

**Redirected to `/login` in a loop**
The Supabase session cookie isn't being set. Check that the anon key and URL belong to
the same project, and that `http://localhost:3000/auth/callback` is registered as a
redirect URL in Supabase.

**Port 3000 already in use**
```powershell
bun run dev -- -p 3001
```

**PowerShell blocks the Bun install script**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Peer-dependency warnings about `@tiptap/core` / `@tiptap/extension-highlight`**
These come from `tldraw` pinning a slightly different Tiptap version. They are warnings
only — the build and dev server both succeed.
