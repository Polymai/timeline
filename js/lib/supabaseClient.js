import { APP_SCHEMA, getSupabaseConfig, isSupabaseConfigured, STORAGE_BUCKET } from "../config/runtime.js";

const config = getSupabaseConfig();

export const supabase = isSupabaseConfigured() && window.supabase
  ? window.supabase.createClient(config.url, config.anonKey, {
      db: { schema: APP_SCHEMA },
      auth: {
        storageKey: config.authStorageKey,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("TimeLine is waiting for its Supabase runtime configuration.");
  }
  return supabase;
}

export function appRpc(name, args = {}, options = {}) {
  const client = requireSupabase();
  if (typeof client.schema === "function") {
    return client.schema(APP_SCHEMA).rpc(name, args, options);
  }
  return client.rpc(name, args, options);
}

export function mediaBucket() {
  return requireSupabase().storage.from(STORAGE_BUCKET);
}
