import type { Route } from "./+types/practice";
import { PracticePage } from "~/components/practice-page";
import { SiteHeader } from "~/components/site-header";

const TITLE = "Practice pad: Motions";
const DESCRIPTION =
  "A full-page Vim editor in the browser. Real keybindings, a scratch buffer, nothing saved.";

export function meta({}: Route.MetaArgs) {
  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
  ];
}

export default function Practice() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteHeader />
      <PracticePage />
    </div>
  );
}
