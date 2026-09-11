import type { VimPadState } from "~/lib/vim-pad";

export type Drill = {
  id: string;
  prompt: string;
  /** One key sequence that solves it. Shown on request, and used by the tests. */
  hint: string;
  doc: string;
  /**
   * Checks the result rather than the keys pressed, so any route Vim allows
   * counts as a solution.
   */
  done: (now: VimPadState, start: VimPadState) => boolean;
  /** Solved with j/k, which need real pixel measurement. Verified in-browser. */
  needsLayout?: boolean;
};

const PROSE = [
  "the quick brown fox",
  "jumps over the lazy dog",
  "and lands on its feet",
].join("\n");

const lines = (s: VimPadState) => s.text.split("\n");

export const DRILLS: Drill[] = [
  {
    id: "move-down",
    needsLayout: true,
    prompt: "Move the cursor down one line",
    hint: "j",
    doc: PROSE,
    done: (now, start) => now.text === start.text && now.cursor.line === start.cursor.line + 1,
  },
  {
    id: "line-end",
    prompt: "Jump to the end of the line",
    hint: "$",
    doc: PROSE,
    done: (now, start) =>
      now.text === start.text &&
      now.cursor.line === start.cursor.line &&
      now.cursor.ch === lines(now)[now.cursor.line].length - 1,
  },
  {
    id: "last-line",
    prompt: "Jump to the last line of the buffer",
    hint: "G",
    doc: PROSE,
    done: (now, start) => now.text === start.text && now.cursor.line === lines(now).length - 1,
  },
  {
    id: "delete-word",
    prompt: "Delete the word under the cursor",
    hint: "diw",
    doc: PROSE,
    done: (now, start) => lines(now)[0] === lines(start)[0].replace(/^the/, ""),
  },
  {
    id: "change-word",
    prompt: 'Change "quick" to "slow"',
    hint: "wciwslow<Esc>",
    doc: PROSE,
    done: (now) => lines(now)[0] === "the slow brown fox",
  },
  {
    id: "append-end",
    prompt: 'Add "!" to the end of the first line',
    hint: "A!<Esc>",
    doc: PROSE,
    done: (now, start) => lines(now)[0] === `${lines(start)[0]}!`,
  },
  {
    id: "duplicate-line",
    prompt: "Duplicate this line below itself",
    hint: "yyp",
    doc: PROSE,
    done: (now, start) => {
      const next = lines(now);
      return next.length === lines(start).length + 1 && next[0] === next[1];
    },
  },
  {
    id: "delete-line",
    needsLayout: true,
    prompt: "Delete the middle line",
    hint: "jdd",
    doc: PROSE,
    done: (now) => now.text === "the quick brown fox\nand lands on its feet",
  },
  {
    id: "repeat",
    prompt: "Delete the first two words, using . for the second",
    hint: "dw.",
    doc: PROSE,
    done: (now) => lines(now)[0] === "brown fox",
  },
  {
    id: "visual-line",
    needsLayout: true,
    prompt: "Select the first two lines and delete them",
    hint: "Vjd",
    doc: PROSE,
    done: (now) => now.text === "and lands on its feet",
  },
  {
    id: "find-char",
    prompt: 'Jump to the "b" in "brown"',
    hint: "fb",
    doc: PROSE,
    done: (now, start) =>
      now.text === start.text && now.cursor.line === 0 && now.cursor.ch === 10,
  },
  {
    id: "open-below",
    prompt: 'Open a new line below and type "done"',
    hint: "odone<Esc>",
    doc: PROSE,
    done: (now, start) => lines(now).length === lines(start).length + 1 && lines(now)[1] === "done",
  },
];
