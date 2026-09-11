/** Default document for the full-page practice editor. */
export const SCRATCH = `# scratch.md
A throwaway buffer for practising Vim. Nothing here is saved.

## Motions
The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.

Jump by word, find a character, or go to a line.

## Operators
delete  change  yank  put  indent  join  substitute

Try diw on a word, ci" on a quote, or yap on a paragraph.

"inner quotes are a text object"
(parentheses too, and so are [brackets])

## A function
function greet(name) {
  const message = "hello, " + name;
  return message;
}

## Markup
<p class="note">Tags have inner and outer objects: dit, dat, cit.</p>

## Ex
:w  :q  :s/old/new/g  :%s/foo/bar/gc  :noh

Press i to insert, Esc to return to normal.
`;
