import { supabase } from "../lib/supabaseClient.js";

function getStripeConfig() {
  return window.__POLYMAI_STRIPE_CONFIG__ || {};
}

function checkoutEndpoint() {
  const config = getStripeConfig();
  if (!config.functionsBaseUrl) {
    throw new Error("Payments are not connected yet.");
  }
  return `${config.functionsBaseUrl.replace(/\/$/, "")}/app706-timeline-api`;
}

async function authHeader() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sign in again before opening checkout.");
  }
  return `Bearer ${data.session.access_token}`;
}

export function extraCompanyPriceLabel() {
  const config = getStripeConfig();
  const amount = Number(config.extraCompanyUnitAmount || 900) / 100;
  const currency = String(config.currency || "usd").toUpperCase();
  return `$${amount.toFixed(0)} ${currency} incl. VAT`;
}

export async function startExtraCompanyCheckout({ companyName, displayName }) {
  const response = await fetch(checkoutEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await authHeader(),
    },
    body: JSON.stringify({
      action: "start-extra-company-checkout",
      companyName,
      displayName,
      returnUrl: window.location.href.split("#")[0],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Checkout could not be opened.");
  }
  if (!payload.url) {
    throw new Error("Checkout did not return a redirect URL.");
  }
  return payload.url;
}
