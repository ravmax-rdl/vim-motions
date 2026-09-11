import { afterEach, describe, expect, test } from "vitest";
import { createVimPad, parseKeys, type VimPad } from "~/lib/vim-pad";
import { conformanceCases } from "~/lib/vim-pad.cases";
import { runCase } from "~/lib/vim-pad.run-conformance";

let pad: VimPad | null = null;

function open(doc: string, keys: string) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  pad = createVimPad({ parent, doc });
  pad.sendKeys(keys);
  return pad;
}

afterEach(() => {
  pad?.destroy();
  pad = null;
  document.body.replaceChildren();
});

/**
 * Cases flagged `needsLayout` need real pixel measurement, which jsdom cannot
 * provide. `bun run test:browser` runs the full table, these included, against
 * a real browser.
 */
describe("vim conformance (jsdom)", () => {
  for (const c of conformanceCases.filter((item) => !item.needsLayout && !item.knownDeviation)) {
    test(c.name, () => {
      const result = runCase(c);
      expect(result.detail ?? "pass").toBe("pass");
    });
  }
});

describe("key notation", () => {
  test("splits plain keys into single strokes", () => {
    expect(parseKeys("dw")).toEqual(["d", "w"]);
  });

  test("keeps angle-bracket keys whole", () => {
    expect(parseKeys("cw<Esc>")).toEqual(["c", "w", "<Esc>"]);
  });

  test("keeps control chords whole", () => {
    expect(parseKeys("<C-v>jd")).toEqual(["<C-v>", "j", "d"]);
  });

  test("treats a dangling angle bracket as a literal", () => {
    expect(parseKeys("a<b")).toEqual(["a", "<", "b"]);
  });
});

describe("pad api", () => {
  test("reports the starting state before any key is sent", () => {
    const p = open("one\ntwo", "");
    expect(p.text()).toBe("one\ntwo");
    expect(p.cursor()).toEqual({ line: 0, ch: 0 });
    expect(p.mode()).toBe("normal");
  });

  test("notifies a subscriber when the document changes", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const seen: string[] = [];
    pad = createVimPad({ parent, doc: "abc", onChange: (s) => seen.push(s.text) });
    pad.sendKeys("x");
    expect(seen.at(-1)).toBe("bc");
  });

  test("notifies a subscriber when the mode changes", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const modes: string[] = [];
    pad = createVimPad({ parent, doc: "abc", onChange: (s) => modes.push(s.mode) });
    pad.sendKeys("i");
    expect(modes.at(-1)).toBe("insert");
  });

  test("records the keys that were pressed", () => {
    const p = open("abc", "dw");
    expect(p.keys()).toEqual(["d", "w"]);
  });

  test("keeps the key trail bounded", () => {
    const p = open("abc", "llllllllllllllllllll");
    expect(p.keys().length).toBeLessThanOrEqual(12);
  });

  test("reset restores the original document and normal mode", () => {
    const p = open("abc", "ix");
    p.reset();
    expect(p.text()).toBe("abc");
    expect(p.mode()).toBe("normal");
  });

  test("reset accepts a replacement document", () => {
    const p = open("abc", "x");
    p.reset("fresh");
    expect(p.text()).toBe("fresh");
  });

  test("reset clears the key trail", () => {
    const p = open("abc", "dw");
    p.reset();
    expect(p.keys()).toEqual([]);
  });

  test("reset discards undo history from the previous attempt", () => {
    const p = open("abc", "x");
    p.reset();
    p.sendKeys("u");
    expect(p.text()).toBe("abc");
  });

  test("destroy removes the editor from the DOM", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const p = createVimPad({ parent, doc: "abc" });
    p.destroy();
    expect(parent.querySelector(".cm-editor")).toBeNull();
  });

  test("real keydown events drive the editor, not just sendKeys", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    pad = createVimPad({ parent, doc: "alpha beta" });
    const content = parent.querySelector(".cm-content")!;
    for (const key of ["d", "w"]) {
      content.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    }
    expect(pad.text()).toBe("beta");
  });
});
