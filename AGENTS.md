# Repository Guidelines

## Project Structure & Module Organization
- `app/` uses the Next.js App Router; key routes live under `events`, `gifts`, `login`, `profile`, and `api/` for route handlers. `globals.css` holds Tailwind base styles and app-wide tokens.
- `components/` hosts reusable UI such as the calendar primitives, nav, and theming helpers; keep shared widgets here in PascalCase files.
- `lib/` contains core services (auth, Supabase client, Drizzle ORM setup, schema, and shared types). Database migrations are in `supabase/migrations/` with supporting Drizzle artifacts in `drizzle/`.
- `public/` holds static assets; add new images or fonts here. `scripts/upload-og-image.js` is a utility for asset uploads.

## Build, Test, and Development Commands
- `npm run dev` — start the local Next.js server on port 3000.
- `npm run build` — produce the optimized production build.
- `npm run start` — run the built app locally; use after `npm run build`.
- `npm run lint` — run ESLint (Next.js core-web-vitals + TypeScript rules).
- Database workflows: configure credentials in `.env.local`, then run Drizzle CLI commands (e.g., `npx drizzle-kit push`) from `drizzle.config.ts` if schema changes are made.

## Coding Style & Naming Conventions
- TypeScript-first React with functional components. Use PascalCase for components and files in `components/`; camelCase for functions/variables/hooks; SCREAMING_SNAKE_CASE for environment variables.
- Prefer 2-space indentation, single quotes, and early returns for clarity. Co-locate route-specific utilities under their route folder; shared logic lives in `lib/`.
- Let ESLint guide formatting; fix issues via `npm run lint -- --fix` before committing.

## Testing Guidelines
- No automated tests are present yet; linting is the current gate. For new features, add unit or integration coverage (Vitest/React Testing Library) and mirror the route structure in a `tests/` folder.
- When adding API handlers, include lightweight schema validation and happy/error-path checks. Run `npm run lint` before opening a PR.

## Commit & Pull Request Guidelines
- Git history favors short, present-tense summaries (`Update login page`, `Add OG Image`). Follow that pattern and keep scope focused.
- Pull requests should describe the change, note any migrations or environment updates, and link issues if relevant. Include screenshots or clips for UI changes (desktop + mobile). Call out breaking changes and manual steps (e.g., running migrations or `node scripts/upload-og-image.js`).

## Environment & Configuration
- Create `.env.local` from `env.example`; include Supabase credentials and any OpenAI keys used by server routes. Avoid committing secrets.
- When changing database schemas (`lib/schema.ts`), generate and check in matching migration files under `supabase/migrations/`; ensure `drizzle.config.ts` stays in sync with the target database URL.
-- Fonts: we default to system UI stacks to avoid network fetches; no remote font downloads are required.
