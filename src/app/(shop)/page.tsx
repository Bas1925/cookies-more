import Hero from "@/components/sections/Hero";
import ShopMenu from "@/components/sections/ShopMenu";
import BuildABox from "@/components/sections/BuildABox";
import Instagram from "@/components/sections/Instagram";
import Footer from "@/components/sections/Footer";
import { STORE } from "@/lib/data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export default function Home() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo-google.png`,
      contentUrl: `${SITE_URL}/logo-google.png`,
      width: 512,
      height: 512,
    },
    sameAs: [STORE.instagramUrl],
    areaServed: "Israel",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Hero />
      <ShopMenu />
      <BuildABox />
      <Instagram />
      <Footer />
    </>
  );
}
