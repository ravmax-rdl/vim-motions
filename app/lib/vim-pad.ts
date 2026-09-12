import { EditorState, Transaction } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { history, historyKeymap, isolateHistory } from "@codemirror/commands";
import { Vim, getCM, vim } from "@replit/codemirror-vim";
import { registerTagTextObject } from "~/lib/vim-tag-object";

export type VimPadMode =
  | "normal"
  | "insert"
  | "replace"
  | "visual"
  | "visual-line"
  | "visual-block";

export type VimPadState = {
  text: string;
  cursor: { line: number; ch: number };
  mode: VimPadMode;
  /** Most recent keys, oldest first, for the on-screen key trail. */
  keys: string[];
};

export type VimPad = {
  sendKeys: (keys: string) => void;
  text: () => string;
  cursor: () => { line: number; ch: number };
  mode: () => VimPadMode;
  keys: () => string[];
  state: () => VimPadState;
  reset: (doc?: string) => void;
  focus: () => void;
  destroy: () => void;
};

export type VimPadOptions = {
  parent: HTMLElement;
  doc: string;
  onChange?: (state: VimPadState) => void;
};

const KEY_TRAIL_LENGTH = 12;

/**
 * Splits Vim key notation into single keystrokes: "dw<Esc>" -> ["d", "w", "<Esc>"].
 */
export function parseKeys(keys: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < keys.length) {
    if (keys[i] === "<") {
      const end = keys.indexOf(">", i);
      if (end !== -1) {
        out.push(keys.slice(i, end + 1));
        i = end + 1;
        continue;
      }
    }
    out.push(keys[i]);
    i += 1;
  }
  return out;
}

/** `<C-a>` and friends are commands; a bare printable key is text to insert. */
function isPrintable(key: string) {
  return key.length === 1 && key !== "\n";
}

export function createVimPad({ parent, doc, onChange }: VimPadOptions): VimPad {
  registerTagTextObject();

  const initialDoc = doc;
  let trail: string[] = [];
  // True while an insert session is open. Read during dispatch, so it always
  // reflects the state *before* the transaction being built - which is what
  // decides whether that transaction starts a new undo step.
  let inInsertSession = false;

  const view = new EditorView({
    parent,
    state: buildState(doc),
  });

  function buildState(text: string) {
    return EditorState.create({
      doc: text,
      extensions: [
        // vim() must come first so its keymap wins over the default bindings.
        vim(),
        // Blockwise visual mode selects one range per line. Without this
        // CodeMirror collapses them to one and Ctrl-v only affects a single row.
        EditorState.allowMultipleSelections.of(true),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        // Vim undoes a whole change as one step: the command that entered
        // insert mode plus everything typed before Esc. CodeMirror instead
        // splits on a timer, so the timer is disabled and undo steps are cut
        // explicitly at command boundaries below.
        history({ newGroupDelay: Infinity, joinToEvent: () => true }),
        EditorState.transactionExtender.of((tr) => {
          if (tr.docChanged) {
            // A change made outside an insert session starts a new undo step.
            return inInsertSession ? null : { annotations: isolateHistory.of("before") };
          }
          // Commands that enter insert mode move the cursor in a separate
          // transaction, and any recorded selection permanently blocks the
          // typed text from joining the command that opened it. Vim restores
          // the cursor from the change itself, so bare cursor moves never need
          // to be in the history.
          if (tr.selection) {
            return { annotations: Transaction.addToHistory.of(false) };
          }
          return null;
        }),
        keymap.of(historyKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged || update.selectionSet) {
            inInsertSession = mode() === "insert" || mode() === "replace";
            emit();
          }
        }),
      ],
    });
  }

  function cm() {
    return getCM(view);
  }

  function vimState(): Record<string, unknown> | undefined {
    return (view.state as unknown as { vim?: Record<string, unknown> }).vim;
  }

  function mode(): VimPadMode {
    const adapter = cm();
    const vs = (adapter?.state as { vim?: Record<string, unknown> } | undefined)?.vim ?? vimState();
    if (!vs) return "normal";
    if (vs.insertMode) {
      const overwrite = (adapter?.state as { overwrite?: boolean } | undefined)?.overwrite;
      return overwrite ? "replace" : "insert";
    }
    if (vs.visualMode) {
      if (vs.visualBlock) return "visual-block";
      if (vs.visualLine) return "visual-line";
      return "visual";
    }
    return "normal";
  }

  function cursor() {
    const head = view.state.selection.main.head;
    const line = view.state.doc.lineAt(head);
    let ch = head - line.from;
    // Vim's normal-mode cursor sits on a character, never past the last one.
    // Real `$` / End can leave CodeMirror's head at `line.to`.
    const current = mode();
    if (current !== "insert" && current !== "replace" && line.length > 0 && ch >= line.length) {
      ch = line.length - 1;
    }
    return { line: line.number - 1, ch };
  }

  function text() {
    return view.state.doc.toString();
  }

  function snapshot(): VimPadState {
    return { text: text(), cursor: cursor(), mode: mode(), keys: [...trail] };
  }

  function emit() {
    onChange?.(snapshot());
  }

  /** The `:` and `/` prompts render a real input; keys have to go there instead. */
  function promptInput(): HTMLInputElement | null {
    return parent.querySelector<HTMLInputElement>(".cm-vim-panel input");
  }

  function sendToPrompt(input: HTMLInputElement, key: string) {
    if (key === "<CR>") {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }),
      );
      return;
    }
    if (key === "<Esc>") {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true }),
      );
      return;
    }
    if (key === "<BS>") {
      input.value = input.value.slice(0, -1);
      return;
    }
    if (isPrintable(key)) input.value += key;
  }

  function sendKey(key: string) {
    const prompt = promptInput();
    if (prompt) {
      sendToPrompt(prompt, key);
      return;
    }

    const adapter = cm();
    if (!adapter) return;

    // In insert mode CodeMirror's vim layer does not type printable characters
    // itself - the browser's own input handling normally does - so sendKeys has
    // to apply them as edits.
    const current = mode();
    if (current === "insert" || current === "replace") {
      if (isPrintable(key)) {
        if (current === "replace") {
          // Replace mode overwrites the character under the cursor, but stops
          // at the line end rather than eating the newline.
          const head = view.state.selection.main.head;
          const line = view.state.doc.lineAt(head);
          view.dispatch({
            changes: { from: head, to: Math.min(head + 1, line.to), insert: key },
            selection: { anchor: head + 1 },
          });
        } else {
          view.dispatch(view.state.replaceSelection(key));
        }
        return;
      }
      if (key === "<CR>") {
        view.dispatch(view.state.replaceSelection("\n"));
        return;
      }
      if (key === "<BS>") {
        const head = view.state.selection.main.head;
        if (head > 0) view.dispatch({ changes: { from: head - 1, to: head } });
        return;
      }
    }

    Vim.handleKey(adapter, key, "user");
  }

  function record(key: string) {
    trail = [...trail, key].slice(-KEY_TRAIL_LENGTH);
  }

  function sendKeys(keys: string) {
    for (const key of parseKeys(keys)) {
      record(key);
      sendKey(key);
    }
    emit();
  }

  // Real typing goes through CodeMirror's own keymap, so mirror those keys into
  // the trail and re-read the mode once the editor has handled them.
  // vimKeyFromEvent returns undefined for lone modifiers (Shift, Control, …);
  // do not fall back to event.key or those leak into the trail as "Shift".
  function onKeyDown(event: KeyboardEvent) {
    const key = Vim.vimKeyFromEvent(event);
    if (!key) return;
    record(key);
    queueMicrotask(emit);
  }

  view.contentDOM.addEventListener("keydown", onKeyDown);

  return {
    sendKeys,
    text,
    cursor,
    mode,
    keys: () => [...trail],
    state: snapshot,
    reset(next?: string) {
      const adapter = cm();
      // These take a CodeMirror whose vim state is already initialised; the
      // adapter's type leaves it optional, so it is narrowed here.
      if (adapter?.state.vim) {
        const initialised = adapter as Parameters<typeof Vim.exitInsertMode>[0];
        Vim.exitVisualMode(initialised, false);
        Vim.exitInsertMode(initialised);
      }
      trail = [];
      view.setState(buildState(next ?? initialDoc));
      emit();
    },
    focus() {
      view.focus();
    },
    destroy() {
      view.contentDOM.removeEventListener("keydown", onKeyDown);
      view.destroy();
    },
  };
}
