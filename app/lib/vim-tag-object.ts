/**
 * `it` / `at` text objects.
 *
 * codemirror-vim ships text objects for brackets, quotes, words, paragraphs and
 * sentences, but not tags, so `dit` and `cit` are silently no-ops. The pad
 * documents those keys, so it has to support them.
 */
import { Vim } from "@replit/codemirror-vim";

type Pos = { line: number; ch: number };

const TAG = /<(\/)?([A-Za-z][-A-Za-z0-9:]*)\b[^>]*?(\/)?>/g;

/** HTML elements that never have a closing tag, so they never enclose a cursor. */
const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

export type TagRange = { innerFrom: number; innerTo: number; outerFrom: number; outerTo: number };

/**
 * Finds the innermost tag pair enclosing `offset`, or null when the cursor is
 * not inside one.
 */
export function findEnclosingTag(text: string, offset: number): TagRange | null {
  const open: { name: string; start: number; end: number }[] = [];
  let best: TagRange | null = null;

  TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG.exec(text))) {
    const [raw, closing, name, selfClosing] = match;
    const start = match.index;
    const end = start + raw.length;
    if (selfClosing || VOID_TAGS.has(name.toLowerCase())) continue;

    if (!closing) {
      open.push({ name, start, end });
      continue;
    }

    // Pop until the matching opening tag; unbalanced markup just gets skipped.
    let pair: { name: string; start: number; end: number } | undefined;
    while (open.length) {
      const candidate = open.pop()!;
      if (candidate.name === name) {
        pair = candidate;
        break;
      }
    }
    if (!pair) continue;

    if (offset >= pair.start && offset < end) {
      const range: TagRange = {
        innerFrom: pair.end,
        innerTo: start,
        outerFrom: pair.start,
        outerTo: end,
      };
      // Later matches close earlier, so each qualifying pair is tighter.
      if (!best || range.outerTo - range.outerFrom <= best.outerTo - best.outerFrom) {
        best = range;
      }
    }
  }

  return best;
}

function toPos(text: string, offset: number): Pos {
  let line = 0;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "\n") {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, ch: offset - lineStart };
}

function toOffset(text: string, pos: Pos): number {
  let offset = 0;
  for (let i = 0; i < pos.line; i++) {
    const next = text.indexOf("\n", offset);
    if (next === -1) return offset;
    offset = next + 1;
  }
  return offset + pos.ch;
}

let registered = false;

/** Registers `it`/`at`. Safe to call repeatedly; the keymap is global. */
export function registerTagTextObject() {
  if (registered) return;
  registered = true;

  Vim.defineMotion("tagTextObject", (cm: any, head: Pos, motionArgs: any) => {
    const text: string = cm.getValue();
    const offset = toOffset(text, head);
    const found = findEnclosingTag(text, offset);
    if (!found) return head;

    const inner = !!motionArgs.textObjectInner;
    const from = inner ? found.innerFrom : found.outerFrom;
    const to = inner ? found.innerTo : found.outerTo;
    if (to <= from) return head;

    // Text-object motions report a half-open range, matching the built-in
    // bracket and quote objects.
    return [toPos(text, from), toPos(text, to)];
  });

  for (const context of ["operatorPending", "visual"] as const) {
    Vim.mapCommand("it", "motion", "tagTextObject", { textObjectInner: true }, { context });
    Vim.mapCommand("at", "motion", "tagTextObject", { textObjectInner: false }, { context });
  }
}
