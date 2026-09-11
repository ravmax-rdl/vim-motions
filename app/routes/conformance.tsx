/**
 * Dev-only harness. CodeMirror resolves j/k and blockwise selections through
 * real pixel measurement, which jsdom cannot produce, so the cases flagged
 * `needsLayout` are verified here in a real browser. Registered from routes.ts
 * only outside production builds.
 */
import { useEffect, useState } from "react";
import { conformanceCases } from "~/lib/vim-pad.cases";
import {
  runAllCases,
  runAllDrills,
  runCase,
  type CaseResult,
} from "~/lib/vim-pad.run-conformance";

type Report = { total: number; failures: CaseResult[]; deviations: CaseResult[] } | null;

export default function Conformance() {
  const [report, setReport] = useState<Report>(null);
  const [drills, setDrills] = useState<{ total: number; failures: CaseResult[] } | null>(null);

  useEffect(() => {
    const result = runAllCases();
    const drills = runAllDrills();
    setReport(result);
    setDrills(drills);
    // Exposed so an automated browser check can read the result directly, and
    // so one-off cases can be probed from the console.
    Object.assign(window, {
      __vimConformance: result,
      __vimDrills: drills,
      __vimRunCase: runCase,
    });
  }, []);

  const layoutCases = conformanceCases.filter((c) => c.needsLayout).length;

  return (
    <main style={{ fontFamily: "monospace", padding: 24, lineHeight: 1.6 }}>
      <h1>Vim conformance</h1>
      {report === null ? (
        <p>running…</p>
      ) : (
        <>
          <p>
            {report.total - report.failures.length - report.deviations.length} / {report.total}{" "}
            passed ({layoutCases} need real layout)
          </p>
          {report.failures.length === 0 ? (
            <p style={{ color: "green" }}>no failures</p>
          ) : (
            <ul>
              {report.failures.map((f) => (
                <li key={f.name} style={{ color: "crimson" }}>
                  {f.name} — {f.detail}
                </li>
              ))}
            </ul>
          )}
          {report.deviations.length > 0 && (
            <>
              <h2>Known upstream deviations</h2>
              <ul>
                {report.deviations.map((d) => (
                  <li key={d.name} style={{ color: "darkorange" }}>
                    {d.name} — {d.detail}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {drills && (
        <>
          <h2>Drills</h2>
          <p>
            {drills.total - drills.failures.length} / {drills.total} solvable by their hint
          </p>
          <ul>
            {drills.failures.map((f) => (
              <li key={f.name} style={{ color: "crimson" }}>
                {f.name} — {f.detail}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
