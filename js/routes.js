import { DEFAULT_ROUTE, normalizeRoute, ROUTES } from "./config/runtime.js";

const adminRoutes = new Set([ROUTES.company, ROUTES.people, ROUTES.catalog, ROUTES.directory]);

export function readRoute() {
  return normalizeRoute(window.location.hash.replace(/^#/, "") || DEFAULT_ROUTE);
}

export function navigate(route) {
  const next = normalizeRoute(route);
  if (window.location.hash !== `#${next}`) {
    window.location.hash = next;
  }
}

export function bindRouter(onRoute) {
  window.addEventListener("hashchange", () => onRoute(readRoute()));
  onRoute(readRoute());
}

export function routeForRole(route, role) {
  const normalized = normalizeRoute(route);
  if (adminRoutes.has(normalized) && role !== "admin") {
    return ROUTES.time;
  }
  return normalized;
}
