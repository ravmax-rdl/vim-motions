import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { m } from "motion/react";
import { CopyGlyph, MatchMeter } from "~/components/ascii";
import type { Answer } from "~/data/answers";
import type { Command, GroupId, Section, SectionId } from "~/data/catalog";
import { commandCount, commands, groupCount, groups, sections } from "~/data/catalog";
import {
  highlightText,
  matchStrength,
  searchAnswers,
  searchCommands,
  type SearchHit,
} from "~/lib/search";

type Props = {
  query: string;
  onQuery: (value: string) => void;
  group: GroupId | "all";
  onGroup: (value: GroupId | "all") => void;
  sectionId: SectionId | null;
  onSection: (value: SectionId | null) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
};

export function CommandDirectory({
  query,
  onQuery,
  group,
  onGroup,
  sectionId,
  onSection,
  searchRef,
}: Props) {
  const needle = query.trim();
  const searching = needle.length > 0;

  const pool = useMemo(
    () =>
      commands.filter((command) => {
        if (sectionId) return command.sectionId === sectionId;
        if (group === "all") return true;
        return command.group === group;
      }),
    [group, sectionId],
  );

  const hits = useMemo(() => searchCommands(query, pool), [pool, query]);
  const answers = useMemo(() => (searching ? searchAnswers(needle) : []), [needle, searching]);
  const bestScore = hits[0]?.score ?? 0;

  const grouped = useMemo(() => {
    const bySection = new Map<SectionId, SearchHit[]>();
    for (const hit of hits) {
      const list = bySection.get(hit.command.sectionId) ?? [];
      list.push(hit);
      bySection.set(hit.command.sectionId, list);
    }
    return sections
      .map((section) => ({ section, items: bySection.get(section.id) ?? [] }))
      .filter((entry) => entry.items.length > 0);
  }, [hits]);

  const activeSection = sections.find((section) => section.id === sectionId);

  return (
    <section id="directory" className="scroll-mt-24 pt-16 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-mono text-sm tracking-[0.08em] text-ink">
          <span className="text-dim">:: </span>command index
        </h2>
        <p className="font-mono text-xs text-dim" aria-live="polite">
          {hits.length}/{commandCount}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="command-search" className="sr-only">
            Search commands in plain language
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim"
            weight="regular"
            aria-hidden="true"
          />
          <input
            id="command-search"
            ref={searchRef}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="delete a word, end of line, paste…"
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full rounded-[var(--radius-box)] border border-line bg-chip pr-12 pl-10 text-sm text-ink placeholder:text-dim focus:border-accent focus:outline-none"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-[var(--radius-kbd)] border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted">
            /
          </kbd>
        </div>

        <div
          className="no-scrollbar flex flex-nowrap gap-1 overflow-x-auto"
          role="group"
          aria-label="Filter by group"
        >
          {groups.map((item) => {
            const isOn = !sectionId && group === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isOn}
                onClick={() => onGroup(item.id)}
                className={`h-10 shrink-0 rounded-[var(--radius-box)] border px-3 font-mono text-[12px] whitespace-nowrap ${
                  isOn
                    ? "border-accent bg-chip text-ink"
                    : "border-line text-muted hover:border-ink/40 hover:text-ink"
                }`}
              >
                {item.label}
                <span className="hidden sm:inline"> ({groupCount(item.id)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeSection ? (
        <p className="mt-3 font-mono text-sm text-muted">
          showing {activeSection.name}.{" "}
          <button type="button" onClick={() => onSection(null)} className="text-accent hover:underline">
            clear
          </button>
        </p>
      ) : null}

      {answers.map((answer) => (
        <AnswerCard key={answer.id} answer={answer} />
      ))}

      {hits.length === 0 ? (
        <EmptyState hasAnswer={answers.length > 0} query={needle} />
      ) : searching ? (
        <ol className="mt-6 border-t border-line">
          {hits.map((hit, index) => (
            <CommandRow
              key={hit.command.id}
              hit={hit}
              strength={matchStrength(hit, bestScore)}
              index={index}
            />
          ))}
        </ol>
      ) : (
        <div className="mt-2">
          {grouped.map(({ section, items }) => (
            <SectionBlock key={section.id} section={section} items={items} />
          ))}
        </div>
      )}
    </section>
  );
}

function AnswerCard({ answer }: { answer: Answer }) {
  return (
    <m.article
      className="mt-6 rounded-[var(--radius-box)] border border-accent/40 bg-accent/5 px-4 py-4"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <h3 className="font-mono text-[12px] tracking-[0.08em] text-accent">
        [ {answer.title} ]
      </h3>
      <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-muted">{answer.body}</p>
      {answer.related.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[11px] text-dim">related:</span>
          {answer.related.map((keys) => (
            <kbd
              key={keys}
              className="rounded-[var(--radius-kbd)] border border-line bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink"
            >
              {keys}
            </kbd>
          ))}
        </p>
      )}
    </m.article>
  );
}

function EmptyState({ hasAnswer, query }: { hasAnswer: boolean; query: string }) {
  return (
    <m.div
      className="mt-6 rounded-[var(--radius-box)] border border-line bg-chip px-6 py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="font-mono text-sm text-ink">
        {hasAnswer ? "[ no single command ]" : `[ no match for “${query}” ]`}
      </p>
      <p className="mx-auto mt-2 max-w-[48ch] text-sm text-muted">
        Try describing the edit instead of the key:{" "}
        <span className="font-mono text-ink">delete a word</span>,{" "}
        <span className="font-mono text-ink">end of line</span>, or{" "}
        <span className="font-mono text-ink">save and quit</span>.
      </p>
    </m.div>
  );
}

function SectionBlock({ section, items }: { section: Section; items: SearchHit[] }) {
  return (
    <section id={`sec-${section.id}`} className="scroll-mt-24 border-t border-line py-6">
      <div className="px-2">
        <h3 className="font-mono text-[13px] text-ink">
          <span className="text-dim">-- </span>
          {section.name}
          <span className="text-dim"> --</span>
        </h3>
        {section.tip ? <p className="mt-1 max-w-[65ch] text-sm text-muted">{section.tip}</p> : null}
      </div>
      <ol className="mt-3">
        {items.map((hit) => (
          <CommandRow key={hit.command.id} hit={hit} />
        ))}
      </ol>
    </section>
  );
}

function Marks({ text, tokens }: { text: string; tokens: string[] }) {
  return (
    <>
      {highlightText(text, tokens).map((part) =>
        part.mark ? <mark key={part.key}>{part.text}</mark> : <span key={part.key}>{part.text}</span>,
      )}
    </>
  );
}

function CommandRow({
  hit,
  strength,
  index = 0,
}: {
  hit: SearchHit;
  strength?: number;
  index?: number;
}) {
  const command = hit.command;
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const searching = strength !== undefined;

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    const text = command.keys;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1200);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
  }

  function onActivate() {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    void copy();
  }

  return (
    <m.li
      id={anchorFor(command)}
      className="scroll-mt-24 border-b border-line"
      initial={searching ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 10) * 0.024 }}
    >
      <button
        type="button"
        onClick={onActivate}
        className={`group grid w-full cursor-pointer items-baseline gap-x-3 gap-y-0.5 px-2 py-2 text-left hover:bg-row md:items-center ${
          searching
            ? "grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_minmax(7rem,13rem)_1fr_auto_6rem_auto]"
            : "grid-cols-[auto_1fr_auto] md:grid-cols-[auto_minmax(7rem,14rem)_1fr_6rem_auto]"
        }`}
      >
        <span
          className="w-3 font-mono text-[11px] text-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        >
          &gt;
        </span>
        <code className="font-mono text-[13px] text-ink">
          <Marks text={command.keys} tokens={hit.tokens} />
        </code>
        <p
          className={`text-sm text-muted md:truncate ${
            searching ? "col-span-4 md:col-span-1" : "col-span-3 md:col-span-1"
          }`}
        >
          <Marks text={command.description} tokens={hit.tokens} />
        </p>
        {searching ? (
          <span className="row-start-1 md:row-start-auto">
            <MatchMeter value={strength} />
          </span>
        ) : null}
        <span className="hidden text-xs text-dim md:block md:truncate">{command.sectionShort}</span>
        <span className="row-start-1 justify-self-end p-1.5 md:row-start-auto">
          <CopyGlyph copied={copied} />
          <span className="sr-only">{copied ? `Copied ${command.keys}` : `Copy ${command.keys}`}</span>
        </span>
      </button>
    </m.li>
  );
}

function anchorFor(command: Command) {
  return `cmd-${command.id}`;
}
