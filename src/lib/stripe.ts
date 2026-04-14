import Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-03-25.dahlia";
export const STRIPE_APP_NAME = "Receps ERP";
const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_LANDING_URL = "http://localhost:3000";

let stripeClient: Stripe | null = null;
type CheckoutPaymentMethodType = "card" | "boleto" | "pix";

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/$/, "");
}

export function getLandingUrl() {
  return (process.env.NEXT_PUBLIC_LANDING_URL || DEFAULT_LANDING_URL).replace(/\/$/, "");
}

export function getStripeWebhookSecret() {
  return readRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
}

export function getStripeDashboardBaseUrl() {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com";
}

export function getStripeCustomerDashboardUrl(stripeCustomerId: string) {
  return `${getStripeDashboardBaseUrl()}/customers/${stripeCustomerId}`;
}

export function getStripeCheckoutPaymentMethodTypes(): CheckoutPaymentMethodType[] {
  const configuredTypes = process.env.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) as CheckoutPaymentMethodType[] | undefined;

  return configuredTypes?.length ? configuredTypes : ["card"];
}

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(readRequiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: STRIPE_API_VERSION,
      appInfo: {
        name: STRIPE_APP_NAME,
        version: "0.1.0",
        url: getAppUrl(),
      },
      typescript: true,
    });
  }

  return stripeClient;
}
