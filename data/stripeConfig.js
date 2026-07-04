// Polymai runtime Stripe config.
// Frontend-safe only: publishable key, mode, display pricing, and public Edge Functions base URL.
// Never add Stripe secret keys, webhook secrets, restricted keys, or private tokens here.
(function () {
  const supabaseConfig = window.__POLYMAI_SUPABASE_CONFIG__ || window.__SUPABASE_CONFIG__ || {};
  const config = Object.freeze({
    publishableKey: "",
    mode: "payment",
    functionsBaseUrl: supabaseConfig.functionsBaseUrl || "",
    currency: "usd",
    extraCompanyUnitAmount: 900,
    vatIncluded: true,
  });
  window.__POLYMAI_STRIPE_CONFIG__ = config;
})();
