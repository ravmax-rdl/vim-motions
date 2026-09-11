import { createVimPad } from "~/lib/vim-pad";
import { conformanceCases, type VimCase } from "~/lib/vim-pad.cases";
import { DRILLS } from "~/lib/drills";

export type CaseResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

/** Runs one case against a freshly created pad and reports the first mismatch. */
export function runCase(c: VimCase): CaseResult {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const pad = createVimPad({ parent, doc: c.doc });
  try {
    pad.sendKeys(c.keys);
    const text = pad.text();
    if (text !== c.text) {
      return {
        name: c.name,
        passed: false,
        detail: `text: expected ${JSON.stringify(c.text)}, got ${JSON.stringify(text)}`,
      };
    }
    if (c.cursor) {
      const got = `${pad.cursor().line}:${pad.cursor().ch}`;
      if (got !== c.cursor) {
        return { name: c.name, passed: false, detail: `cursor: expected ${c.cursor}, got ${got}` };
      }
    }
    if (c.mode) {
      const got = pad.mode();
      if (got !== c.mode) {
        return { name: c.name, passed: false, detail: `mode: expected ${c.mode}, got ${got}` };
      }
    }
    return { name: c.name, passed: true };
  } catch (error) {
    return { name: c.name, passed: false, detail: `threw: ${(error as Error).message}` };
  } finally {
    pad.destroy();
    parent.remove();
  }
}

/** Runs the whole table. Used by the in-browser harness. */
export function runAllCases(): {
  total: number;
  failures: CaseResult[];
  deviations: CaseResult[];
} {
  const failures: CaseResult[] = [];
  const deviations: CaseResult[] = [];
  for (const c of conformanceCases) {
    const result = runCase(c);
    if (result.passed) continue;
    if (c.knownDeviation) deviations.push({ ...result, detail: c.knownDeviation });
    else failures.push(result);
  }
  return { total: conformanceCases.length, failures, deviations };
}

/**
 * Every drill must be solvable by its own hint, and must not already be solved
 * before the user types anything.
 */
export function runAllDrills(): { total: number; failures: CaseResult[] } {
  const failures: CaseResult[] = [];
  for (const drill of DRILLS) {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const pad = createVimPad({ parent, doc: drill.doc });
    try {
      const start = pad.state();
      if (drill.done(start, start)) {
        failures.push({ name: drill.id, passed: false, detail: "already complete before any key" });
        continue;
      }
      pad.sendKeys(drill.hint);
      if (!drill.done(pad.state(), start)) {
        failures.push({
          name: drill.id,
          passed: false,
          detail: `hint ${JSON.stringify(drill.hint)} did not complete it`,
        });
      }
    } catch (error) {
      failures.push({ name: drill.id, passed: false, detail: `threw: ${(error as Error).message}` });
    } finally {
      pad.destroy();
      parent.remove();
    }
  }
  return { total: DRILLS.length, failures };
}
