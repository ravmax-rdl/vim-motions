import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { m } from "motion/react";
import type { VimPad, VimPadState } from "~/lib/vim-pad";

export const MODE_LABEL: Record<VimPadState["mode"], string> = {
  normal: "NORMAL",
  insert: "INSERT",
  replace: "REPLACE",
  visual: "VISUAL",
  "visual-line": "V-LINE",
  "visual-block": "V-BLOCK",
};

/** Keys a touch keyboard cannot produce, plus the ones drills lean on. */
export const TOUCH_KEYS: { label: string; keys: string }[] = [
  { label: "Esc", keys: "<Esc>" },
  { label: "h", keys: "h" },
  { label: "j", keys: "j" },
  { label: "k", keys: "k" },
  { label: "l", keys: "l" },
  { label: "w", keys: "w" },
  { label: "b", keys: "b" },
  { label: "d", keys: "d" },
  { label: "y", keys: "y" },
  { label: "p", keys: "p" },
  { label: "u", keys: "u" },
  { label: ":", keys: ":" },
  { label: "/", keys: "/" },
];

export type VimEditorHandle = {
  reset: (doc: string) => void;
  sendKeys: (keys: string) => void;
  focus: () => void;
  ready: () => boolean;
};

type Props = {
  doc: string;
  autoStart?: boolean;
  className?: string;
  fill?: boolean;
  onState?: (state: VimPadState) => void;
  placeholderHint?: string;
  ref?: React.Ref<VimEditorHandle>;
};

export function VimEditor({
  doc,
  autoStart = false,
  className = "",
  fill = false,
  onState,
  placeholderHint = "Click to start",
  ref,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<VimPad | null>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const docRef = useRef(doc);
  docRef.current = doc;

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!autoStart) return;
      setLoading(true);
      try {
        const { createVimPad } = await import("../lib/vim-pad");
        const host = hostRef.current;
        if (cancelled || !host) return;
        padRef.current?.destroy();
        host.replaceChildren();
        const pad = createVimPad({
          parent: host,
          doc: docRef.current,
          onChange: (state) => onStateRef.current?.(state),
        });
        if (cancelled) {
          pad.destroy();
          return;
        }
        padRef.current = pad;
        onStateRef.current?.(pad.state());
        setReady(true);
        pad.focus();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      padRef.current?.destroy();
      padRef.current = null;
    };
  }, [autoStart]);

  async function activate() {
    if (padRef.current) {
      padRef.current.focus();
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const { createVimPad } = await import("../lib/vim-pad");
      const host = hostRef.current;
      if (!host || padRef.current) return;
      host.replaceChildren();
      const pad = createVimPad({
        parent: host,
        doc: docRef.current,
        onChange: (state) => onStateRef.current?.(state),
      });
      padRef.current = pad;
      onStateRef.current?.(pad.state());
      setReady(true);
      pad.focus();
    } finally {
      setLoading(false);
    }
  }

  useImperativeHandle(ref, () => ({
    reset(next) {
      padRef.current?.reset(next);
      padRef.current?.focus();
    },
    sendKeys(keys) {
      padRef.current?.sendKeys(keys);
      padRef.current?.focus();
    },
    focus() {
      padRef.current?.focus();
    },
    ready() {
      return padRef.current !== null;
    },
  }));

  return (
    <div
      className={`relative font-mono text-[13px] ${
        fill ? "flex min-h-0 flex-1 flex-col" : "min-h-[12rem]"
      } ${className}`}
    >
      <div ref={hostRef} className={`vim-host ${fill ? "min-h-0 flex-1" : "h-full min-h-[12rem]"}`} />
      {!ready && (
        <button
          type="button"
          onClick={() => void activate()}
          className="absolute inset-0 z-10 flex w-full cursor-text flex-col overflow-hidden px-3 py-3 text-left"
          aria-label="Start the interactive Vim editor"
        >
          {doc.split("\n").slice(0, 16).map((line, index) => (
            <span key={index} className="flex gap-3 whitespace-pre">
              <span className="w-4 shrink-0 text-right text-[11px] text-muted">{index + 1}</span>
              <span className="truncate text-ink">{line || " "}</span>
            </span>
          ))}
          <span className="mt-3 block text-[12px] text-muted">
            {loading ? "Loading editor…" : placeholderHint}
          </span>
        </button>
      )}
    </div>
  );
}

export function TouchKeyBar({ onKey }: { onKey: (keys: string) => void }) {
  return (
    <div
      className="no-scrollbar flex gap-1 overflow-x-auto pb-1 sm:hidden"
      aria-label="On-screen Vim keys"
    >
      {TOUCH_KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          onClick={() => onKey(key.keys)}
          className="h-9 min-w-9 shrink-0 rounded-[var(--radius-kbd)] border border-line bg-chip px-2 font-mono text-[13px] text-ink active:bg-chip-hover"
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

export function ModeBadge({ mode }: { mode: VimPadState["mode"] }) {
  const active = mode !== "normal";
  return (
    <span
      className={`shrink-0 rounded-[var(--radius-kbd)] px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] ${
        active ? "bg-accent text-accent-ink" : "border border-line text-muted"
      }`}
    >
      {active ? `[${MODE_LABEL[mode]}]` : MODE_LABEL[mode]}
    </span>
  );
}

export function KeyTrail({ keys }: { keys: string[] }) {
  if (keys.length === 0) {
    return <span className="font-mono text-[11px] text-muted">_ ready</span>;
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {keys.map((key, index) => (
        <m.kbd
          key={`${key}-${index}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="rounded-[var(--radius-kbd)] border border-line bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-accent"
        >
          {key}
        </m.kbd>
      ))}
    </div>
  );
}
