export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Supabase renamed this key: older projects hand out `anon` (a JWT starting
 * with `eyJ`), newer ones hand out a `sb_publishable_...` key, and the Connect
 * dialog names the variable differently in each case. Both work with
 * supabase-js, so accept either name.
 *
 * These have to be written as literal `process.env.X` lookups - Next replaces
 * them at build time and a dynamic `process.env[name]` would come back empty.
 */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

/**
 * True once both env vars look like real values. Every page checks this so the
 * site renders a friendly "connect Supabase" card instead of crashing while
 * the project is still being set up.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
