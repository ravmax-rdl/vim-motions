# Motions

A searchable Vim reference with a practice pad that runs real Vim keybindings.

- **283 commands** you can search in plain English — "delete a word", "save and quit",
  "go to line 42". Questions Vim has no single command for (commenting, multiple cursors,
  surround) get a written answer instead of the closest-looking keys.
- **A practice pad** built on [CodeMirror](https://codemirror.net/) and
  [codemirror-vim](https://github.com/replit/codemirror-vim): visual and blockwise modes,
  registers, macros, marks, text objects, `.` repeat, search and ex commands.

The editor is about 130 KB gzipped and is fetched only when someone opens the pad, so the
page itself stays light.

## Develop

The project uses [Bun](https://bun.sh). `bun.lock` is the committed lockfile.

```bash
bun install
bun run dev        # http://localhost:5173
bun run test       # vitest
bun run typecheck
bun run build
```

## Testing the emulator

Accuracy is the point of the pad, so the Vim behaviour is pinned by a conformance table in
`app/lib/vim-pad.cases.ts`. Each row is a document, a key sequence, and the resulting text
and cursor position, checked against Vim 9 by hand.

`bun run test` runs the table in jsdom. Cases flagged `needsLayout` are skipped there:
CodeMirror resolves `j`/`k` and blockwise selections through real pixel measurement, which
jsdom cannot produce. To run the full table, including those, start the dev server and open
`/__conformance` — a dev-only route that also checks every drill is solvable by its own hint.

### Known deviation

A linewise delete that reaches the last line (`dG`, `2dd`, `:2,3d`) leaves a trailing blank
line where Vim removes it. At the point the change is dispatched it is indistinguishable
from a charwise `0d$` on the final line, which legitimately leaves that blank, so the pad
has no signal to correct only the first case. It is recorded in the conformance table via
`knownDeviation` and reported separately rather than dropped.

## Layout

```
app/
  components/   UI
  data/         catalog.ts (the commands), answers.ts (the "Vim can't do that" entries)
  lib/          vim-pad.ts (editor wrapper), search.ts (ranking), drills.ts
  routes/       home.tsx, conformance.tsx (dev only)
test/setup-cm.ts  jsdom layout stub for CodeMirror
```
