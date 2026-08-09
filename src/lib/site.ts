function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL;

export const SITE_URL = configuredUrl
  ? withProtocol(configuredUrl).replace(/\/$/, "")
  : "http://localhost:3000";

export const SITE_NAME = "Cookies & More";
export const SITE_DESCRIPTION =
  "Fresh cookies, cakes, mini cakes and cinnamon rolls for delivery or pickup.";
