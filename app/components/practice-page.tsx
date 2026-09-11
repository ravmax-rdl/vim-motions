import { useRef, useState } from "react";
import { SCRATCH } from "~/data/scratch";
import type { VimPadState } from "~/lib/vim-pad";
import {
  KeyTrail,
  ModeBadge,
  TouchKeyBar,
  VimEditor,
  type VimEditorHandle,
} from "~/components/vim-editor";

export function PracticePage() {
  const editorRef = useRef<VimEditorHandle>(null);
  const [state, setState] = useState<VimPadState | null>(null);
  const mode = state?.mode ?? "normal";
  const cursor = state?.cursor ?? { line: 0, ch: 0 };
  const lines = state?.text.split("\n").length ?? SCRATCH.split("\n").length;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 md:px-6">
        <p className="truncate font-mono text-[13px] text-muted">
          scratch.md <span className="text-dim">[unsaved]</span>
        </p>
        <p className="hidden font-mono text-[12px] text-dim sm:block">nothing is saved. Esc leaves insert.</p>
        <ModeBadge mode={mode} />
      </div>

      <VimEditor
        ref={editorRef}
        doc={SCRATCH}
        autoStart
        fill
        onState={setState}
        placeholderHint="Loading editor…"
      />

      <div className="border-t border-line px-4 py-2 md:px-6">
        <TouchKeyBar onKey={(keys) => editorRef.current?.sendKeys(keys)} />
        <div className="flex items-center justify-between gap-3">
          <KeyTrail keys={state?.keys ?? []} />
          <p className="shrink-0 font-mono text-[11px] text-dim">
            {cursor.line + 1}:{cursor.ch + 1} / {lines}
          </p>
        </div>
      </div>
    </main>
  );
}
