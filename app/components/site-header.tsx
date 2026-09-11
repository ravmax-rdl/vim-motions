import { Link, NavLink } from "react-router";
import { BlinkCursor } from "~/components/ascii";

const nav = [
  { to: "/practice", label: "Practice", nav: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 md:h-16 md:px-6">
        <Link to="/" className="group flex items-center text-ink">
          <span className="font-display text-[17px] tracking-[0.04em]">MOTIONS</span>
          <BlinkCursor />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 font-mono text-[12px] text-muted sm:gap-6">
          {nav.map((item) =>
            item.nav ? (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `group inline-flex items-center ${isActive ? "text-ink" : "hover:text-ink"}`
                }
              >
                <span className="mr-1 text-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                  &gt;
                </span>
                {item.label}
              </NavLink>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className="group inline-flex items-center hover:text-ink"
              >
                <span className="mr-1 text-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                  &gt;
                </span>
                {item.label}
              </Link>
            ),
          )}
          <a
            href="https://vimhelp.org/"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center hover:text-ink"
          >
            <span className="mr-1 text-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
              &gt;
            </span>
            Vim docs
            <span className="ml-1 text-dim" aria-hidden="true">
              ^
            </span>
          </a>
        </nav>
      </div>
    </header>
  );
}
