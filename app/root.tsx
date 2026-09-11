import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Analytics } from "@vercel/analytics/react";

import type { Route } from "./+types/root";
import { MotionRoot } from "~/components/motion-root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0c0c0c" />
        <Meta />
        <Links />
      </head>
      <body>
        <MotionRoot>
          {children}
          <ScrollRestoration />
          <Scripts />
          <Analytics />
        </MotionRoot>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something broke";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "That page is not in this buffer."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-16">
      <p className="font-mono text-sm text-accent">{message}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{details}</h1>
      <a
        href="/"
        className="mt-8 inline-flex h-10 items-center rounded-[var(--radius-box)] border border-line bg-chip px-4 font-mono text-sm text-ink hover:bg-chip-hover"
      >
        [ Back to motions ]
      </a>
      {stack && (
        <pre className="mt-8 overflow-x-auto rounded-[var(--radius-box)] border border-line bg-chip p-4 text-xs text-muted">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
