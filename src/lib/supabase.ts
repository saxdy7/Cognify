import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazily construct the browser client on first use. This keeps the static
// prerender of client pages (e.g. /dashboard) from instantiating Supabase at
// build time — which would throw if env vars aren't inlined yet — while still
// requiring real credentials at runtime in the browser.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (locally in .env, and in your Vercel project settings).'
    );
  }
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}

// Proxy so existing `import { supabase }` usage works unchanged — the real
// client is only created the first time a property/method is accessed.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient() as object, prop, receiver);
    return typeof value === 'function' ? value.bind(getClient()) : value;
  },
});
