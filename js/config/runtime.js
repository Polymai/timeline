export const APP_ID = "app706";
export const APP_SCHEMA = "app706_timeline";
export const STORAGE_BUCKET = "app706_timeline_media";
export const DEFAULT_ROUTE = "/time";

export const ROUTES = {
  time: "/time",
  company: "/admin/company",
  people: "/admin/people",
  catalog: "/admin/catalog",
  directory: "/admin/directory",
};

export function getSupabaseConfig() {
  const config = window.__POLYMAI_SUPABASE_CONFIG__ || window.__SUPABASE_CONFIG__ || {};
  return {
    appId: config.appId || APP_ID,
    url: config.url || "",
    anonKey: config.anonKey || "",
    functionsBaseUrl: config.functionsBaseUrl || "",
    siteUrl: config.siteUrl || "",
    appStoragePrefix: config.appStoragePrefix || `polymai:${APP_ID}:`,
    authStorageKey: config.authStorageKey || `polymai:${APP_ID}:auth`,
  };
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function scopedStorageKey(key) {
  return `${getSupabaseConfig().appStoragePrefix}${key}`;
}

export function writeScopedStorage(key, value) {
  try {
    window.localStorage.setItem(scopedStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.warn("Unable to write scoped storage", error);
  }
}

export function readScopedStorage(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(scopedStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function removeScopedStorage(key) {
  try {
    window.localStorage.removeItem(scopedStorageKey(key));
  } catch (error) {
    console.warn("Unable to clear scoped storage", error);
  }
}

export function getAuthRedirectUrl() {
  const config = getSupabaseConfig();
  const { protocol, hostname, origin, pathname } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocal) {
    return `${origin}${pathname}`;
  }
  if (config.siteUrl) {
    return config.siteUrl;
  }
  if (protocol === "file:") {
    return window.location.href.split("#")[0];
  }
  return `${origin}${pathname}`;
}

export function normalizeRoute(route) {
  const value = String(route || "").replace(/^#/, "") || DEFAULT_ROUTE;
  return Object.values(ROUTES).includes(value) ? value : DEFAULT_ROUTE;
}
