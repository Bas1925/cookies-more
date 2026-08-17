function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Netlify sets URL to the site's primary address — the custom domain once one
 * is attached. It has to be checked before the Vercel names: the Next runtime
 * on Netlify fills those in with the *.netlify.app subdomain, which then ends
 * up in canonical, og:url and the sitemap even when the shop is being served
 * from its real domain, and a link preview pointing at another host is the
 * kind of mismatch that stops the card rendering at all.
 */
const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL;

export const SITE_URL = configuredUrl
  ? withProtocol(configuredUrl).replace(/\/$/, "")
  : "http://localhost:3000";

export const SITE_NAME = "Cookies & More";
export const SITE_DESCRIPTION =
  "Fresh cookies, cakes, mini cakes and cinnamon rolls for delivery or pickup.";
