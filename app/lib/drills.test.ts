import { afterEach, describe, expect, test } from "vitest";
import { createVimPad, type VimPad } from "~/lib/vim-pad";
import { DRILLS } from "~/lib/drills";

let pad: VimPad | null = null;

function padFor(doc: string) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  pad = createVimPad({ parent, doc });
  return pad;
}

afterEach(() => {
  pad?.destroy();
  pad = null;
  document.body.replaceChildren();
});

describe("drills", () => {
  test("there is at least one drill", () => {
    expect(DRILLS.length).toBeGreaterThan(0);
  });

  test("every drill has a unique id", () => {
    expect(new Set(DRILLS.map((d) => d.id)).size).toBe(DRILLS.length);
  });

  for (const drill of DRILLS.filter((d) => !d.needsLayout)) {
    test(`${drill.id}: is not already complete at the start`, () => {
      const p = padFor(drill.doc);
      const start = p.state();
      expect(drill.done(start, start)).toBe(false);
    });

    test(`${drill.id}: the hint "${drill.hint}" completes it`, () => {
      const p = padFor(drill.doc);
      const start = p.state();
      p.sendKeys(drill.hint);
      expect(drill.done(p.state(), start)).toBe(true);
    });
  }

  test.each(["dw", "diw", "de"])("delete-word accepts %s", (keys) => {
    const drill = DRILLS.find((d) => d.id === "delete-word")!;
    const p = padFor(drill.doc);
    const start = p.state();
    p.sendKeys(keys);
    expect(drill.done(p.state(), start)).toBe(true);
  });
});
