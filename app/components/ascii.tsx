import { m } from "motion/react";

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const staggerFast = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function BlinkCursor({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`ascii-cursor ml-1 inline-block h-[0.8em] w-[0.45em] translate-y-[0.08em] bg-accent ${className}`}
    />
  );
}

const METER_CELLS = 6;

export function MatchMeter({ value }: { value: number }) {
  const ratio = Math.max(0, Math.min(1, value));
  const filled = Math.round(ratio * METER_CELLS);
  const pct = Math.round(ratio * 100);

  return (
    <span
      className="inline-flex h-6 items-center border border-line bg-chip px-1.5 font-mono text-[11px] leading-none tracking-[0.14em]"
      title={`${pct}% match`}
      aria-label={`${pct} percent match`}
    >
      <span aria-hidden="true" className="flex">
        <span className="text-dim">[</span>
        {Array.from({ length: METER_CELLS }, (_, index) => {
          const on = index < filled;
          return (
            <m.span
              key={index}
              className={on ? "text-accent" : "text-dim"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.028 * index, duration: 0.16 }}
            >
              {on ? "#" : "-"}
            </m.span>
          );
        })}
        <span className="text-dim">]</span>
      </span>
    </span>
  );
}

export function CopyGlyph({ copied }: { copied: boolean }) {
  return (
    <span className="inline-block w-3 text-center font-mono text-[12px] leading-none" aria-hidden="true">
      {copied ? (
        <m.span
          key="ok"
          className="text-accent"
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          *
        </m.span>
      ) : (
        <span className="text-dim group-hover:text-ink">+</span>
      )}
    </span>
  );
}

export function WellCorners() {
  return (
    <>
      <span className="pointer-events-none absolute top-2 left-2 h-3 w-3 border-t border-l border-dim" />
      <span className="pointer-events-none absolute top-2 right-2 h-3 w-3 border-t border-r border-dim" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-dim" />
      <span className="pointer-events-none absolute right-2 bottom-2 h-3 w-3 border-r border-b border-dim" />
    </>
  );
}
