import type { Route } from "./+types/home";
import { MotionsPage } from "~/components/motions-page";
import { SiteFooter } from "~/components/site-footer";
import { SiteHeader } from "~/components/site-header";
import { commandCount } from "~/data/catalog";

const SITE_URL = "https://motions.vercel.app";
const TITLE = "Motions";
const DESCRIPTION = `Search ${commandCount} Vim motions, operators and ex commands in plain English, and practise them in a pad that runs real Vim keybindings.`;

export function meta({}: Route.MetaArgs) {
  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { tagName: "link", rel: "canonical", href: SITE_URL },

    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Motions" },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: SITE_URL },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESCRIPTION },

    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Motions",
        url: SITE_URL,
        description: DESCRIPTION,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    },
  ];
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#directory"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-[var(--radius-box)] focus:bg-chip focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to command index
      </a>
      <SiteHeader />
      <MotionsPage />
      <SiteFooter />
    </div>
  );
}
