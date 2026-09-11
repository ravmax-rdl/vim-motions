import { commandCount } from "~/data/catalog";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-[12px] text-dim md:px-6">
        <p>
          <span className="text-accent">//</span> ravmax
        </p>
        <p>
          practice pad ::{" "}
          <a
            href="https://codemirror.net/"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
          >
            CodeMirror
          </a>
          {" + "}
          <a
            href="https://github.com/replit/codemirror-vim"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
          >
            codemirror-vim
          </a>
        </p>
      </div>
    </footer>
  );
}
