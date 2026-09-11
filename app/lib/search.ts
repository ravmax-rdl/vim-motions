import type { Command } from "~/data/catalog";

const STOP = new Set([
  "a",
  "an",
  "the",
  "to",
  "of",
  "in",
  "on",
  "for",
  "my",
  "this",
  "that",
  "me",
  "i",
  "how",
  "do",
  "can",
  "please",
  "with",
  "from",
  "into",
  "it",
  "is",
  "and",
  "or",
  // Filler that appears in questions but never in a command description.
  "everything",
  "every",
  "anything",
  "something",
  "all",
  "show",
  "make",
  "want",
  "need",
  "use",
  "using",
  "way",
  "what",
  "when",
  "where",
  "which",
  "would",
  "could",
  "should",
  "there",
  "here",
  "out",
  "best",
  "quickly",
  "easily",
  "vim",
]);

const SYN: Record<string, string[]> = {
  delete: ["delete", "cut", "remove", "kill"],
  cut: ["delete", "cut", "remove"],
  remove: ["delete", "remove"],
  copy: ["yank", "copy"],
  yank: ["yank", "copy"],
  paste: ["put", "paste"],
  put: ["put", "paste"],
  move: ["move", "jump", "go"],
  jump: ["jump", "move", "go"],
  go: ["go", "jump", "move"],
  word: ["word"],
  line: ["line"],
  file: ["file", "buffer", "document"],
  buffer: ["buffer", "file"],
  window: ["window", "split", "pane"],
  split: ["split", "window", "pane"],
  pane: ["window", "pane"],
  tab: ["tab"],
  search: ["search", "find", "pattern"],
  find: ["find", "search", "occurrence"],
  replace: ["replace", "substitute", "change"],
  undo: ["undo"],
  redo: ["redo"],
  save: ["write", "save"],
  write: ["write", "save"],
  quit: ["quit", "exit"],
  exit: ["quit", "exit"],
  insert: ["insert", "append"],
  append: ["append", "insert"],
  visual: ["visual", "select", "mark"],
  select: ["visual", "select", "mark"],
  indent: ["indent", "shiftwidth"],
  fold: ["fold"],
  down: ["down"],
  up: ["up"],
  left: ["left"],
  right: ["right"],
  end: ["end", "last"],
  start: ["start", "first", "beginning"],
  beginning: ["start", "beginning"],
  top: ["top", "first"],
  bottom: ["bottom", "last"],
  clipboard: ["clipboard", "register"],
  register: ["register", "clipboard"],
  matching: ["matching"],
  brace: ["matching"],
  bracket: ["matching"],
  paren: ["matching"],
  help: ["help", "man"],
  number: ["number", "increment", "decrement"],
  increase: ["increase", "increment", "add"],
  increment: ["increment", "increase"],
  decrease: ["decrease", "decrement"],
  decrement: ["decrement", "decrease"],
  join: ["join"],
  case: ["case", "uppercase", "lowercase"],
  uppercase: ["uppercase", "case"],
  lowercase: ["lowercase", "case"],
  macro: ["macro", "record"],
  record: ["macro", "record"],
  mark: ["mark", "bookmark"],
  bookmark: ["mark"],
  open: ["open", "edit"],
  close: ["close", "quit"],
  next: ["next"],
  previous: ["previous"],
  prev: ["previous"],
  screen: ["screen", "page"],
  page: ["page", "screen"],
  half: ["half"],
  character: ["character"],
  char: ["character"],
  paragraph: ["paragraph"],
  change: ["change", "replace"],
  substitute: ["replace", "substitute"],
  spell: ["spell"],
  diff: ["diff"],
};

const PHRASES: { re: RegExp; keys: string[] }[] = [
  { re: /delete\s+(the\s+|a\s+)?word/, keys: ["dw", "diw", "daw", "cw / ce", "ciw"] },
  { re: /change\s+(the\s+|a\s+)?word/, keys: ["ciw", "cw / ce"] },
  { re: /delete\s+(the\s+|a\s+)?line/, keys: ["dd", "cc", "S"] },
  { re: /delete\s+(to\s+)?end/, keys: ["d$ / D", "c$ / C"] },
  { re: /copy\s+(the\s+|a\s+)?line|yank\s+(the\s+|a\s+)?line/, keys: ["yy", "y$ / Y", "2yy"] },
  { re: /copy|yank/, keys: ['"+y', "yy", "yw", "yiw", "y$ / Y"] },
  { re: /paste\s+from\s+(the\s+)?clipboard/, keys: ['"+p', '"+y'] },
  { re: /paste|put\s+(after|before)?/, keys: ["p", "P", "gp", "gP", '"+p', '"0p'] },
  { re: /clipboard/, keys: ['"+y', '"+p', '"*', '"+'] },
  { re: /undo/, keys: ["u", "U", "Ctrl + r", "5u", ":earlier 5m"] },
  { re: /redo/, keys: ["Ctrl + r", ":later 5m"] },
  { re: /save\s+and\s+quit|write\s+and\s+quit/, keys: [":wq / :x / ZZ", ":wqa"] },
  { re: /save|write(\s+file)?/, keys: [":w", ":wq / :x / ZZ", ":wqa"] },
  { re: /without\s+sav/, keys: [":q! / ZQ"] },
  { re: /quit|exit|leave/, keys: [":q", ":q! / ZQ", ":wq / :x / ZZ"] },
  { re: /end\s+of\s+(the\s+)?line/, keys: ["$", "A", "g_", "d$ / D"] },
  { re: /start\s+of\s+(the\s+)?line|beginning\s+of\s+(the\s+)?line/, keys: ["0", "^", "I"] },
  { re: /top|first\s+line|start\s+of\s+(the\s+)?(file|document)/, keys: ["gg", "H"] },
  { re: /bottom|last\s+line|end\s+of\s+(the\s+)?(file|document)/, keys: ["G", "L"] },
  { re: /next\s+word/, keys: ["w", "W", "e", "E"] },
  { re: /prev(ious)?\s+word|back(ward)?\s+a?\s*word/, keys: ["b", "B", "ge", "gE"] },
  { re: /search|find/, keys: ["/pattern", "?pattern", "n", "N", "*", "#", "fx"] },
  { re: /replace\s+(all|every)|substitute/, keys: [":%s/old/new/g", ":%s/old/new/gc"] },
  { re: /vertical\s+split|split\s+vert/, keys: ["Ctrl + wv", ":vs[plit] file"] },
  { re: /split/, keys: ["Ctrl + ws", ":sp[lit] file", "Ctrl + wv"] },
  { re: /new\s+line\s+below|open\s+below/, keys: ["o"] },
  { re: /new\s+line\s+above|open\s+above/, keys: ["O"] },
  { re: /insert\s+at\s+(the\s+)?end|append(\s+at)?\s+end/, keys: ["A"] },
  { re: /insert\s+(at\s+)?(the\s+)?(start|beginning)/, keys: ["I"] },
  { re: /indent|re-?indent/, keys: [">>", "<<", "=%", "gg=G", "3=="] },
  { re: /fold/, keys: ["za", "zo", "zc", "zf", "zr", "zm", "zi"] },
  { re: /matching|brace|bracket|paren/, keys: ["%"] },
  { re: /half\s+page|page\s+down/, keys: ["Ctrl + d", "Ctrl + f"] },
  { re: /page\s+up|half\s+page\s+up/, keys: ["Ctrl + u", "Ctrl + b"] },
  { re: /next\s+tab/, keys: ["gt / :tabn[ext]"] },
  { re: /prev(ious)?\s+tab/, keys: ["gT / :tabp[revious]"] },
  { re: /visual\s+block/, keys: ["Ctrl + v"] },
  { re: /select|visual/, keys: ["v", "V", "Ctrl + v", "gv"] },
  { re: /macro|record|replay/, keys: ["qa", "q", "@a", "@@"] },
  { re: /mark|bookmark/, keys: ["ma", "`a", ":marks", "``"] },
  { re: /help/, keys: [":h[elp] keyword", "K"] },
  { re: /line\s+numbers?/, keys: [":set number", ":set relativenumber"] },
  { re: /join/, keys: ["J", "gJ"] },
  { re: /uppercase|capital/, keys: ["gU", "U"] },
  { re: /lowercase/, keys: ["gu"] },
  { re: /repeat\s+last/, keys: ["."] },
  { re: /go\s+to\s+line/, keys: ["5gg / 5G"] },
  { re: /center/, keys: ["zz"] },
  { re: /spell/, keys: [":set spell", "]s", "[s", "z="] },
  { re: /diff/, keys: ["do / :diffg[et]", "dp / :diffpu[t]", ":diffthis"] },
  { re: /go\s+down|move\s+down/, keys: ["j", "Ctrl + e"] },
  { re: /go\s+up|move\s+up/, keys: ["k", "Ctrl + y"] },
  { re: /delete\s+(a\s+)?char/, keys: ["x", "dl", "X / dh"] },
];

export type SearchHit = {
  command: Command;
  score: number;
  /** Share of the query's weight that this command actually matched. */
  coverage: number;
  tokens: string[];
};

/**
 * Match meter, 0..1, relative to the best hit in this result set. Weak
 * queries never reach this path: searchCommands already drops them.
 */
export function matchStrength(hit: SearchHit, bestScore: number) {
  if (bestScore <= 0) return 0;
  return Math.max(0, Math.min(1, hit.score / bestScore));
}

function stem(word: string) {
  if (word.length <= 4) return word;
  return word
    .replace(/ing$/, "")
    .replace(/ied$/, "y")
    .replace(/ies$/, "y")
    .replace(/ers$/, "er")
    .replace(/ed$/, "")
    .replace(/s$/, "");
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+$%^]+/i)
    .map((token) => token.trim())
    .filter((token) => token && !STOP.has(token) && !/^\d+$/.test(token))
    .map(stem);
}

function expand(tokens: string[]) {
  const out = new Set<string>();
  for (const token of tokens) {
    out.add(token);
    const syns = SYN[token];
    if (syns) syns.forEach((item) => out.add(item));
  }
  return [...out];
}

/**
 * Phrase keys stay case-sensitive. Lowercasing them makes "gU" collide with
 * "gu", so a query about uppercasing would boost the lowercase command.
 */
function phraseBoosts(query: string) {
  const keys = new Set<string>();
  const primary = new Set<string>();
  for (const phrase of PHRASES) {
    if (!phrase.re.test(query)) continue;
    primary.add(phrase.keys[0]);
    phrase.keys.forEach((key) => keys.add(key));
    break;
  }
  return { keys, primary };
}

/**
 * Inverse document frequency over the catalogue. Without it a query like
 * "multiple cursors" scores any command whose description mentions the cursor,
 * because every token counts the same. Weighting by rarity makes the
 * distinctive word carry the match.
 */
const idfCache = new WeakMap<object, Map<string, number>>();

function haystackOf(command: Command) {
  return `${command.keys} ${command.description} ${command.sectionName} ${command.sectionShort}`;
}

function idfFor(pool: Command[]) {
  const cached = idfCache.get(pool);
  if (cached) return cached;

  const frequency = new Map<string, number>();
  for (const command of pool) {
    for (const token of new Set(tokenize(haystackOf(command)))) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }

  const weights = new Map<string, number>();
  for (const [token, count] of frequency) {
    weights.set(token, Math.log((pool.length + 1) / (count + 1)) + 0.2);
  }
  idfCache.set(pool, weights);
  return weights;
}

/** Unseen words are the most distinctive ones a query can contain. */
function weightOf(weights: Map<string, number>, token: string) {
  return weights.get(token) ?? Math.log(300) + 0.2;
}

/**
 * Matches on a word boundary rather than anywhere in the string, so "uppercase"
 * does not match inside "lowercase" and "case" does not match "staircase".
 * A trailing partial is still allowed, so "quote" matches "quotes".
 */
function containsWord(hay: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}`, "i").test(hay);
}

/** A token counts as matched if it, or any of its synonyms, is in the text. */
function tokenMatches(token: string, hay: string) {
  if (containsWord(hay, token)) return true;
  return (SYN[token] ?? []).some((synonym) => containsWord(hay, synonym));
}

export function scoreCommand(
  command: Command,
  query: string,
  weights?: Map<string, number>,
): SearchHit {
  const needle = query.trim().toLowerCase();
  const keys = command.keys.toLowerCase();
  const desc = command.description.toLowerCase();
  const section = `${command.sectionName} ${command.sectionShort}`.toLowerCase();
  const hay = `${keys} ${desc}`;
  const tokens = tokenize(needle);
  const phrases = phraseBoosts(needle);
  const idf = weights ?? new Map<string, number>();

  let score = 0;
  let strong = false;

  if (keys === needle) {
    score += 120;
    strong = true;
  } else if (keys.startsWith(needle)) {
    score += 70;
    strong = true;
  } else if (keys.includes(needle)) {
    score += 42;
    strong = true;
  }
  if (desc.includes(needle)) {
    score += 28;
    strong = true;
  }
  if (section.includes(needle)) score += 14;

  if (tokens.some((token) => desc === token || desc === `${token}.`)) {
    score += 90;
    strong = true;
  }

  if (phrases.primary.has(command.keys)) {
    score += 72;
    strong = true;
  } else if (phrases.keys.has(command.keys)) {
    score += 38;
    strong = true;
  } else {
    for (const key of phrases.primary) {
      if (command.keys.includes(key)) {
        score += 14;
        break;
      }
    }
  }

  let matchedWeight = 0;
  let totalWeight = 0;
  for (const token of tokens) {
    const weight = weightOf(idf, token);
    totalWeight += weight;
    if (!tokenMatches(token, hay)) continue;
    matchedWeight += weight;

    const candidates = [token, ...(SYN[token] ?? [])];
    if (candidates.some((c) => keys === c)) score += weight * 8;
    if (candidates.some((c) => containsWord(keys, c))) score += weight * 4;
    if (candidates.some((c) => containsWord(desc, c))) score += weight * 3.5;
    if (candidates.some((c) => containsWord(section, c))) score += weight * 1.2;
  }

  const coverage = totalWeight === 0 ? 1 : matchedWeight / totalWeight;

  if (tokens.length > 0 && !strong && coverage < 0.7) score = 0;
  if (tokens.length > 1 && coverage >= 0.999) score += 20;

  return {
    command,
    score,
    coverage,
    tokens: tokens.filter((token) => token.length > 1 || needle.length <= 2),
  };
}

export function searchCommands(query: string, pool: Command[]): SearchHit[] {
  const needle = query.trim();
  if (!needle) return pool.map((command) => ({ command, score: 0, coverage: 1, tokens: [] }));

  const weights = idfFor(pool);
  const ranked = pool
    .map((command) => scoreCommand(command, needle, weights))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.command.keys.localeCompare(b.command.keys));

  if (ranked.length === 0) return [];

  const best = ranked[0];
  if (best.score < 25 && best.coverage < 0.999) return [];

  const cutoff = Math.max(12, best.score * 0.25);
  return ranked.filter((hit) => hit.score >= cutoff);
}

export { matchAnswers as searchAnswers } from "~/data/answers";

export function highlightText(text: string, tokens: string[]) {
  const needles = [...new Set(tokens.filter((token) => token.length > 0))].sort(
    (a, b) => b.length - a.length,
  );
  if (needles.length === 0) return [{ key: "0", text, mark: false }];

  const escaped = needles.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(escaped.join("|"), "gi");
  const parts: { key: string; text: string; mark: boolean }[] = [];
  let last = 0;
  let index = 0;

  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({ key: `${index++}`, text: text.slice(last, start), mark: false });
    }
    parts.push({ key: `${index++}`, text: match[0], mark: true });
    last = start + match[0].length;
  }

  if (last < text.length) {
    parts.push({ key: `${index++}`, text: text.slice(last), mark: false });
  }

  return parts.length > 0 ? parts : [{ key: "0", text, mark: false }];
}