/**
 * Questions people ask that Vim has no single command for. Answering them
 * plainly beats returning the closest-looking keys, which is what a pure
 * text match does.
 */
export type Answer = {
  id: string;
  title: string;
  body: string;
  /** Command keys, exactly as they appear in the catalog. */
  related: string[];
  match: RegExp;
};

export const answers: Answer[] = [
  {
    id: "comment",
    title: "Vim has no built-in comment command",
    body: "Use a visual block to insert the comment characters on every line: Ctrl + v, select the rows, press I, type the comment prefix, then Esc. To remove them, select the same block and press x. A substitution over a line range works too.",
    related: ["Ctrl + v", ":5,10s/old/new/g"],
    match: /\bcomment(ing|ed)?\b|\buncomment\b/,
  },
  {
    id: "multiple-cursors",
    title: "Vim has no multiple cursors",
    body: "The same edits are usually done with a visual block, a substitution, or a recorded macro replayed on each line. Making the change once and repeating it with . covers most of what multiple cursors are used for.",
    related: ["Ctrl + v", ".", "qa", "@a", ":%s/old/new/g"],
    match: /\bmulti(ple)?[\s-]*cursors?\b|\bmultiple selections?\b/,
  },
  {
    id: "surround",
    title: "Changing surrounding quotes or brackets needs a plugin",
    body: "Vim can delete or change what is inside a pair with text objects, but adding or replacing the pair itself is what tpope's vim-surround provides. Without it, use a substitution or edit both ends by hand.",
    related: ['ci" / di" / yi"', "ci( / di( / yi("],
    match: /\bsurround(ing)?\b|\bwrap\b.*\b(quote|bracket|paren|tag)/,
  },
  {
    id: "wrap",
    title: "Line wrapping is a display option, not an edit",
    body: ":set wrap makes long lines fold visually without changing the file; :set nowrap scrolls sideways instead. Because wrapped lines still count as one line, j and k skip the whole thing - gj and gk move by screen line. To insert real line breaks, use gq with a motion.",
    related: ["gj", "gk", "gq"],
    match: /\bwrap(ping|ped)?\b|\blong lines?\b|\bword ?wrap\b/,
  },
  {
    id: "sort-unique",
    title: "Sorting and de-duplicating are ex commands",
    body: "Sorting works on a line range, so give it one: :sort on its own does the whole file, :'<,'>sort does a visual selection. Adding u drops duplicate lines as it sorts.",
    related: [":sort", ":sort u", ":sort!"],
    match: /\bsort(ing)?\b|\bduplicate lines?\b|\bde-?dup/,
  },
];

export function matchAnswers(query: string): Answer[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return answers.filter((answer) => answer.match.test(needle));
}
