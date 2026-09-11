import { describe, expect, test } from "vitest";
import { commands } from "~/data/catalog";
import { matchStrength, searchAnswers, searchCommands } from "~/lib/search";

const top = (query: string, n = 1) =>
  searchCommands(query, commands)
    .slice(0, n)
    .map((hit) => hit.command.keys);

describe("search finds the right command", () => {
  const expectations: [query: string, keys: string][] = [
    ["delete a word", "dw"],
    ["how do I copy a line", "yy"],
    ["save and quit", ":wq / :x / ZZ"],
    ["go to line 42", "5gg / 5G"],
    ["record a macro", "qa"],
    ["show line numbers", ":set number"],
    ["paste from system clipboard", '"+p'],
    ["move to the matching bracket", "%"],
    ["make text uppercase", "gU"],
    ["indent a block of code", ">>"],
    ["repeat the last command", "."],
    ["open a file in a split", ":sp[lit] file"],
    ["increase the number under the cursor", "Ctrl + a"],
    ["dw", "dw"],
    ["ciw", "ciw"],
  ];

  for (const [query, keys] of expectations) {
    test(`"${query}" ranks ${keys} first`, () => {
      expect(top(query)).toEqual([keys]);
    });
  }

  test("undo ranks u above U", () => {
    const hits = top("undo my last change", 2);
    expect(hits[0]).toBe("u");
  });

  test("replace-all prefers the plain form over the confirm form", () => {
    expect(top("replace every occurrence")).toEqual([":%s/old/new/g"]);
  });

  test("a query about quotes finds the quote text objects", () => {
    expect(top("delete everything inside the quotes")).toEqual(['ci" / di" / yi"']);
  });
});

describe("search declines to guess", () => {
  /** Vim has no built-in for these; noisy substring matches are worse than none. */
  const unanswerable = ["multiple cursors", "comment out a block", "surround with quotes"];

  for (const query of unanswerable) {
    test(`"${query}" returns no command matches`, () => {
      expect(searchCommands(query, commands)).toEqual([]);
    });
  }

  test("gibberish returns nothing", () => {
    expect(searchCommands("qwertyuiop zxcvbnm", commands)).toEqual([]);
  });

  test("an empty query returns the whole catalog", () => {
    expect(searchCommands("", commands)).toHaveLength(commands.length);
  });
});

describe("answers cover what Vim has no command for", () => {
  const answered: [query: string, id: string][] = [
    ["comment out a block", "comment"],
    ["multiple cursors", "multiple-cursors"],
    ["surround with quotes", "surround"],
    ["wrap long lines", "wrap"],
  ];

  for (const [query, id] of answered) {
    test(`"${query}" returns the ${id} answer`, () => {
      expect(searchAnswers(query).map((a) => a.id)).toContain(id);
    });
  }

  test("a normal command query returns no answer", () => {
    expect(searchAnswers("delete a word")).toEqual([]);
  });

  test("every answer names at least one real command to use instead", () => {
    const known = new Set(commands.map((c) => c.keys));
    for (const answer of searchAnswers("comment out a block")) {
      for (const key of answer.related) {
        expect(known.has(key)).toBe(true);
      }
    }
  });
});

describe("match strength", () => {
  test("the top hit is strongest and later hits are shorter", () => {
    const hits = searchCommands("delete a word", commands);
    const best = hits[0]?.score ?? 0;
    const strengths = hits.map((hit) => matchStrength(hit, best));
    expect(strengths[0]).toBeGreaterThan(0.85);
    expect(strengths[0]).toBeGreaterThan(strengths[strengths.length - 1] ?? 0);
    for (let i = 1; i < strengths.length; i++) {
      expect(strengths[i]).toBeLessThanOrEqual(strengths[i - 1] + 1e-6);
    }
    expect(strengths.every((value) => value >= 0 && value <= 1)).toBe(true);
  });
});
