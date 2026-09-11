import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { m } from "motion/react";
import { fadeUp, staggerFast, WellCorners } from "~/components/ascii";
import { CommandDirectory } from "~/components/command-directory";
import { PracticePad } from "~/components/practice-pad";
import { commandCount, type GroupId, type SectionId } from "~/data/catalog";

type SearchPatch = {
  q?: string;
  group?: string;
  section?: string | null;
};

export function MotionsPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const group = (params.get("group") as GroupId | "all" | null) ?? "all";
  const sectionId = (params.get("section") as SectionId | null) ?? null;
  const [query, setQuery] = useState(urlQuery);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const update = useCallback(
    (patch: SearchPatch) => {
      setParams(
        (current) => {
          const draft = new URLSearchParams(current);
          if ("q" in patch) {
            if (patch.q) draft.set("q", patch.q);
            else draft.delete("q");
          }
          if ("group" in patch) {
            if (!patch.group || patch.group === "all") draft.delete("group");
            else draft.set("group", patch.group);
          }
          if ("section" in patch) {
            if (patch.section) draft.set("section", patch.section);
            else draft.delete("section");
          }
          return draft;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const onQuery = useCallback(
    (value: string) => {
      setQuery(value);
      update({ q: value, section: null });
    },
    [update],
  );

  const onGroup = useCallback(
    (value: GroupId | "all") => {
      update({ group: value, section: null });
    },
    [update],
  );

  const onSection = useCallback(
    (value: SectionId | null) => {
      update({ section: value });
    },
    [update],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable ||
        !!target?.closest(".vim-host");

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (typing) return;
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key === "Escape" && !typing) searchRef.current?.blur();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <section className="overflow-hidden">
        <div className="relative pt-16 lg:pt-24">
          <m.div className="space-y-12 md:space-y-16" initial="hidden" animate="show" variants={staggerFast}>
            <div className="relative mx-auto max-w-7xl px-4 md:px-6">
              <m.div variants={fadeUp}>
                <Link
                  to="/practice"
                  className="group flex w-fit items-center gap-2 text-sm font-medium text-ink"
                >
                  <m.span
                    className="rounded-[var(--radius-kbd)] bg-accent px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-accent-ink"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                  >
                    [NEW]
                  </m.span>
                  <span className="text-muted group-hover:text-ink">
                    A full-page pad with real Vim keybindings
                  </span>
                  <span className="font-mono text-dim transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent">
                    -&gt;
                  </span>
                </Link>
              </m.div>

              <div className="grid items-end gap-6 md:grid-cols-2 md:gap-10">
                <m.h1
                  variants={fadeUp}
                  className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.05] text-balance text-ink"
                >
                  Just use vim.
                </m.h1>
                <m.div variants={fadeUp} className="flex max-w-md flex-col gap-6">
                  <p className="text-pretty text-lg leading-relaxed text-muted">
                    Search {commandCount} motions, operators and commands in plain English. The
                    pad runs real Vim keybindings, so what you practise is what you get.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <m.a
                      href="#directory"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-10 w-fit items-center rounded-[var(--radius-box)] bg-accent px-4 font-mono text-sm font-medium text-accent-ink hover:opacity-90"
                    >
                      [ Search commands ]
                    </m.a>
                    <m.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/practice"
                        className="inline-flex h-10 w-fit items-center rounded-[var(--radius-box)] border border-line px-4 font-mono text-sm text-ink hover:border-ink/50 hover:bg-chip"
                      >
                        [ Open full editor ]
                      </Link>
                    </m.div>
                  </div>
                </m.div>
              </div>
            </div>

            <m.div variants={fadeUp} className="mx-auto max-w-7xl max-xl:px-2">
              <div className="hero-well relative aspect-[4/5] overflow-hidden rounded-[var(--radius-box)] border border-line sm:aspect-[5/3] lg:aspect-[16/10]">
                <div aria-hidden="true" className="hero-well-grid pointer-events-none absolute inset-0" />
                <div aria-hidden="true" className="ascii-scan" />
                <WellCorners />
                <div className="absolute inset-3 z-10 flex flex-col overflow-hidden rounded-[var(--radius-box)] border border-line bg-canvas sm:inset-4 lg:inset-8">
                  <PracticePad />
                </div>
              </div>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <CommandDirectory
          query={query}
          onQuery={onQuery}
          group={group}
          onGroup={onGroup}
          sectionId={sectionId}
          onSection={onSection}
          searchRef={searchRef}
        />
      </div>
    </>
  );
}
