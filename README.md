# Guarded View Policy Manager

A small web app for writing viewing rules for private content. You make an account, create a "shared item" (a photo, a document, a message, whatever you'd be sending someone), say who it's for, and attach the viewing restrictions the recipient has to meet before it can be shown, like "only when they're alone" or "never when Eve is in the room."

This is a prototype of the restriction authoring part of my senior design project, Guarded View (FAU Engineering Design, project P18, sponsored by Dr. Hari Kalva and based on U.S. Patent 11,055,437 B2). The nine restriction types in the app are the ones from the patent, using the same identifiers our design documents use.

**Live app:** DEPLOYED_LINK_HERE

**Demo video:** VIDEO_LINK_HERE

## What it does

- **Register, log in and log out** with email and password. You have to be logged in to see or change anything.
- **Create** a shared item with a title, a recipient, an optional message, and one or more viewing restrictions. Some restrictions take a value (a number of viewers, a list of names, a location), and the form checks those before saving.
- **View** all your items as cards, newest first, with each restriction shown as a tag. There's a search box that filters by title or recipient.
- **Edit** any item, including adding or removing restrictions.
- **Delete** an item, which also deletes its restrictions.
- Each user only ever sees their own items. That's enforced in the database with row level security, not just hidden in the page.

The nine restriction types:

| Identifier | Meaning |
|---|---|
| `NUM_VIEWERS` | Exactly this many people may be watching |
| `MAX_VIEWERS` | No more than this many people may be watching |
| `ALLOW_PEOPLE` | Only these people may view |
| `DENY_PEOPLE` | These people must not be present |
| `VIEW_TOGETHER` | Everyone listed has to be there at the same time |
| `ALLOWED_LOCATION` | Only at this location |
| `NO_EXT_RECORDING` | No recording with another device (advisory, a web page can't detect this) |
| `NO_EXT_DISPLAY` | No mirroring or extending to another screen |
| `RECORD_SA` | Keep the situational awareness data so the sender can review it (needs consent) |

This app only authors and stores the rules. The part that actually uses the camera to check them is the main Guarded View project.

## Technologies used

- **React 19 + TypeScript**, built with **Vite**
- **Supabase** for the database (PostgreSQL) and user authentication, through `@supabase/supabase-js`
- **Row level security** policies in Postgres so users can only read and write their own rows
- **Netlify** for hosting
- **Git and GitHub** for version control

## Project structure

```
guarded-view-policy-manager/
├── supabase/
│   └── schema.sql            tables, indexes, trigger and row level security policies
├── src/
│   ├── lib/
│   │   ├── supabase.ts       Supabase client and the TypeScript types for the tables
│   │   └── restrictions.ts   the nine restriction types, labels and input rules
│   ├── components/
│   │   ├── AuthForm.tsx      register / log in form
│   │   ├── Dashboard.tsx     item list, search, edit, delete, log out
│   │   └── ItemForm.tsx      create and edit form with the restriction checklist
│   ├── App.tsx               decides whether to show the login screen or the dashboard
│   ├── App.css / index.css   styling
│   └── main.tsx              entry point
├── .env.example              the two environment variables the app needs
└── index.html
```

### Database

Two tables, one to many:

- `shared_items`: `id`, `owner_id` (the logged in user), `title`, `recipient`, `content`, `created_at`, `updated_at`
- `item_restrictions`: `id`, `item_id` (points to `shared_items`, deleted along with it), `owner_id`, `restriction_type` (limited to the nine identifiers), `value`

`owner_id` defaults to `auth.uid()`, so the app never sends a user id itself, and every policy checks `auth.uid() = owner_id`. An item can't have the same restriction type twice.

## Setup instructions

You need Node.js 20 or newer and a free Supabase account.

1. Clone the repo and install dependencies:
   ```bash
   git clone <this repo's URL>
   cd guarded-view-policy-manager
   npm install
   ```
2. Create a new Supabase project. Open the **SQL Editor**, paste in everything from `supabase/schema.sql`, and run it.
3. In Supabase go to **Authentication → Sign In / Providers → Email** and turn off **Confirm email** if you want accounts to work right away without a confirmation email.
4. Copy `.env.example` to `.env` and fill in your project URL and publishable key from **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
5. Run it locally:
   ```bash
   npm run dev
   ```
   then open http://localhost:5173.
6. To build for deployment:
   ```bash
   npm run build
   ```
   The finished site is in `dist/`. On Netlify, either drag the `dist` folder onto **Deploy manually**, or connect the repo with build command `npm run build`, publish directory `dist`, and the two `VITE_` variables added under environment variables.

The publishable key is meant to be public, it's what the browser uses. What keeps data private is the row level security in `schema.sql`.
