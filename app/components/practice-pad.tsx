import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, m } from "motion/react";
import { DRILLS } from "~/lib/drills";
import type { VimPadState } from "~/lib/vim-pad";
import {
  KeyTrail,
  ModeBadge,
  TouchKeyBar,
  VimEditor,
  type VimEditorHandle,
} from "~/components/vim-editor";

export function PracticePad({ autoStart = true }: { autoStart?: boolean }) {
  const editorRef = useRef<VimEditorHandle>(null);
  const startRef = useRef<VimPadState | null>(null);

  const [state, setState] = useState<VimPadState | null>(null);
  const [drillIndex, setDrillIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const drill = DRILLS[drillIndex];
  const mode = state?.mode ?? "normal";
  const trail = state?.keys ?? [];

  const onState = useCallback((next: VimPadState) => {
    if (!startRef.current) startRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    if (!state || !startRef.current || solved) return;
    if (drill.done(state, startRef.current)) setSolved(true);
  }, [drill, solved, state]);

  const loadDrill = useCallback((index: number) => {
    setDrillIndex(index);
    setSolved(false);
    setShowHint(false);
    startRef.current = null;
    editorRef.current?.reset(DRILLS[index].doc);
  }, []);

  return (
    <section id="practice" className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <p className={`min-w-0 truncate font-mono text-[13px] ${solved ? "text-accent" : "text-muted"}`}>
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={solved ? "solved" : drill.prompt}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="inline-block"
            >
              {solved ? "* solved *" : drill.prompt}
            </m.span>
          </AnimatePresence>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] text-dim">
            {drillIndex + 1}/{DRILLS.length}
          </span>
          <ModeBadge mode={mode} />
        </div>
      </div>

      <VimEditor
        ref={editorRef}
        doc={drill.doc}
        autoStart={autoStart}
        fill
        onState={onState}
        placeholderHint="Click to start. Real Vim keybindings"
      />

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
        <KeyTrail keys={trail} />
        <button
          type="button"
          onClick={() => setShowHint((value) => !value)}
          className="shrink-0 font-mono text-[11px] text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {showHint ? drill.hint : "hint"}
        </button>
      </div>

      <TouchKeyBar onKey={(keys) => editorRef.current?.sendKeys(keys)} />

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <m.button
          type="button"
          onClick={() => loadDrill(drillIndex)}
          whileTap={{ scale: 0.98 }}
          className="h-9 rounded-[var(--radius-box)] border border-line px-3 font-mono text-[12px] text-muted hover:border-ink/50 hover:text-ink"
        >
          [ restart ]
        </m.button>
        <m.button
          type="button"
          onClick={() => loadDrill((drillIndex + 1) % DRILLS.length)}
          whileTap={{ scale: 0.98 }}
          className={`h-9 rounded-[var(--radius-box)] px-3 font-mono text-[12px] ${
            solved ? "bg-accent text-accent-ink" : "border border-line bg-chip text-ink hover:bg-chip-hover"
          }`}
        >
          {solved ? "[ next ]" : "[ skip ]"}
        </m.button>
        <Link
          to="/practice"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-box)] px-3 font-mono text-[12px] text-muted hover:text-ink"
        >
          full editor <span aria-hidden="true">-&gt;</span>
        </Link>
      </div>
    </section>
  );
}
