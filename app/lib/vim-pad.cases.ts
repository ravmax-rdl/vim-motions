/**
 * Vim conformance table shared by the jsdom unit suite and the in-browser
 * harness. Every expectation here was checked against Vim 9 behaviour by hand.
 *
 * `needsLayout` marks cases that depend on pixel measurement - CodeMirror
 * resolves j/k and blockwise selections through real coordinates, which jsdom
 * cannot produce. Those run in a real browser instead (see run-conformance.ts).
 */
export type VimCase = {
  name: string;
  doc: string;
  keys: string;
  text: string;
  cursor?: string;
  mode?: string;
  needsLayout?: boolean;
  /**
   * A behaviour codemirror-vim gets wrong that the pad cannot correct. Reported
   * separately rather than silently dropped, so the gap stays visible.
   */
  knownDeviation?: string;
};

const WORDS = "alpha beta gamma";
const THREE = "one\ntwo\nthree";

export const conformanceCases: VimCase[] = [
  // --- word motions and the operator/motion special cases -------------------
  { name: "dw deletes to the start of the next word", doc: WORDS, keys: "dw", text: "beta gamma" },
  {
    name: "dw on the last word of a line stops at end of line",
    doc: "alpha beta\nsecond line",
    keys: "6ldw",
    text: "alpha \nsecond line",
  },
  {
    name: "cw behaves like ce and leaves the trailing space",
    doc: WORDS,
    keys: "cwX<Esc>",
    text: "X beta gamma",
  },
  { name: "2w moves forward two words", doc: WORDS, keys: "2w", text: WORDS, cursor: "0:11" },
  { name: "e moves to the end of the current word", doc: WORDS, keys: "e", text: WORDS, cursor: "0:4" },
  { name: "b moves back a word", doc: WORDS, keys: "$b", text: WORDS, cursor: "0:11" },
  { name: "de deletes to the end of the word", doc: WORDS, keys: "de", text: " beta gamma" },

  // --- character search -----------------------------------------------------
  { name: "fa jumps to the next a", doc: "banana", keys: "fa", text: "banana", cursor: "0:1" },
  { name: "2fa honours the count", doc: "banana", keys: "2fa", text: "banana", cursor: "0:3" },
  { name: "; repeats the last f", doc: "banana", keys: "fa;", text: "banana", cursor: "0:3" },
  { name: ", reverses the last f", doc: "banana", keys: "3fa,", text: "banana", cursor: "0:3" },
  { name: "tx stops before the target", doc: "a-b-c", keys: "t-", text: "a-b-c", cursor: "0:0" },
  { name: "df- deletes through the target", doc: "a-b-c", keys: "df-", text: "b-c" },
  { name: "dt- deletes up to the target", doc: "abc-d", keys: "dt-", text: "-d" },

  // --- line motions ---------------------------------------------------------
  { name: "$ moves to the last character", doc: WORDS, keys: "$", text: WORDS, cursor: "0:15" },
  { name: "0 moves to column zero", doc: "  indented", keys: "$0", text: "  indented", cursor: "0:0" },
  { name: "^ moves to the first non-blank", doc: "  indented", keys: "$^", text: "  indented", cursor: "0:2" },
  { name: "d$ deletes to end of line", doc: WORDS, keys: "5ld$", text: "alpha" },
  { name: "D deletes to end of line", doc: WORDS, keys: "5lD", text: "alpha" },
  { name: "C changes to end of line", doc: WORDS, keys: "6lCX<Esc>", text: "alpha X" },
  { name: "gg goes to the first line", doc: THREE, keys: "Ggg", text: THREE, cursor: "0:0" },
  { name: "G goes to the last line", doc: THREE, keys: "G", text: THREE, cursor: "2:0" },
  { name: "2G goes to line 2", doc: THREE, keys: "2G", text: THREE, cursor: "1:0" },
  { name: "% jumps to the matching brace", doc: "fn(a, b)", keys: "2l%", text: "fn(a, b)", cursor: "0:7" },
  { name: "} jumps to the next blank line", doc: "a\nb\n\nc", keys: "}", text: "a\nb\n\nc", cursor: "2:0" },
  { name: "j moves down one line", doc: THREE, keys: "j", text: THREE, cursor: "1:0", needsLayout: true },
  { name: "k moves back up one line", doc: THREE, keys: "jjk", text: THREE, cursor: "1:0", needsLayout: true },
  {
    name: "3j moves down three lines",
    doc: "a\nb\nc\nd",
    keys: "3j",
    text: "a\nb\nc\nd",
    cursor: "3:0",
    needsLayout: true,
  },
  { name: "dj deletes two lines", doc: "a\nb\nc", keys: "dj", text: "c", needsLayout: true },
  {
    name: "dG deletes to the end of the file",
    doc: THREE,
    keys: "jdG",
    text: "one",
    needsLayout: true,
    // A linewise delete that reaches the last line should also take the newline
    // that preceded it. codemirror-vim leaves it, so the buffer keeps a blank
    // last line. At dispatch time the change is indistinguishable from a
    // charwise `0d$` on the final line, which legitimately leaves that blank,
    // so there is no signal the pad could use to correct only the first case.
    knownDeviation: "leaves a trailing blank line (upstream codemirror-vim)",
  },

  // --- line operators -------------------------------------------------------
  { name: "dd deletes a line", doc: THREE, keys: "dd", text: "two\nthree" },
  { name: "2dd deletes two lines", doc: THREE, keys: "2dd", text: "three" },
  { name: "yy then p puts the copy below", doc: "one\ntwo", keys: "yyp", text: "one\none\ntwo" },
  { name: "Y yanks linewise", doc: "one\ntwo", keys: "Yp", text: "one\none\ntwo" },
  { name: "yyP puts the copy above", doc: "one\ntwo", keys: "yyP", text: "one\none\ntwo" },
  { name: "cc changes the whole line", doc: "one\ntwo", keys: "ccX<Esc>", text: "X\ntwo" },
  { name: "S changes the whole line", doc: "one\ntwo", keys: "SX<Esc>", text: "X\ntwo" },
  { name: "J joins the next line with a space", doc: "one\ntwo", keys: "J", text: "one two" },
  { name: "gJ joins without a space", doc: "one\ntwo", keys: "gJ", text: "onetwo" },

  // --- text objects ---------------------------------------------------------
  { name: "diw deletes the word under the cursor", doc: WORDS, keys: "6ldiw", text: "alpha  gamma" },
  { name: "daw deletes the word and its space", doc: WORDS, keys: "6ldaw", text: "alpha gamma" },
  { name: "ciw changes the word under the cursor", doc: WORDS, keys: "6lciwX<Esc>", text: "alpha X gamma" },
  { name: 'di" deletes inside double quotes', doc: 'say "hello world" now', keys: '8ldi"', text: 'say "" now' },
  { name: "ci( changes inside parens", doc: "fn(a, b)", keys: "4lci(X<Esc>", text: "fn(X)" },
  { name: "dib deletes inside parens", doc: "fn(a, b)", keys: "4ldib", text: "fn()" },
  { name: "da[ deletes the brackets too", doc: "x[a, b]y", keys: "4lda[", text: "xy" },
  { name: "dip deletes the paragraph", doc: "a\nb\n\nc", keys: "dip", text: "\nc" },
  { name: "yi( then P duplicates the contents", doc: "(ab)", keys: "lyi(P", text: "(abab)" },
  { name: "dit deletes inside a tag", doc: "<p>text</p>", keys: "4ldit", text: "<p></p>" },
  { name: "cit changes inside a tag", doc: "<p>text</p>", keys: "4lcitX<Esc>", text: "<p>X</p>" },
  { name: "dat deletes the whole tag", doc: "x<p>text</p>y", keys: "5ldat", text: "xy" },
  {
    name: "dit picks the innermost of nested tags",
    doc: "<a><b>in</b></a>",
    keys: "7ldit",
    text: "<a><b></b></a>",
  },

  // --- small edits ----------------------------------------------------------
  { name: "x deletes the character under the cursor", doc: "abc", keys: "x", text: "bc" },
  { name: "3x deletes three characters", doc: "abcdef", keys: "3x", text: "def" },
  { name: "X deletes the character before the cursor", doc: "abc", keys: "lX", text: "bc" },
  { name: "s substitutes the character", doc: "abc", keys: "sX<Esc>", text: "Xbc" },
  { name: "r replaces one character", doc: "abc", keys: "rZ", text: "Zbc" },
  { name: "3rZ replaces three characters", doc: "abcdef", keys: "3rZ", text: "ZZZdef" },
  { name: "~ toggles case and advances", doc: "abc", keys: "~", text: "Abc", cursor: "0:1" },
  { name: "xp transposes two characters", doc: "ab", keys: "xp", text: "ba" },
  { name: "gUiw uppercases the word", doc: "hello there", keys: "gUiw", text: "HELLO there" },
  { name: "guiw lowercases the word", doc: "HELLO there", keys: "guiw", text: "hello there" },
  { name: "g~iw toggles the case of the word", doc: "hello", keys: "g~iw", text: "HELLO" },
  { name: "Ctrl-a increments the number", doc: "x 41 y", keys: "<C-a>", text: "x 42 y" },
  { name: "Ctrl-x decrements the number", doc: "x 41 y", keys: "<C-x>", text: "x 40 y" },
  { name: ">> indents the line", doc: "abc", keys: ">>", text: "  abc" },
  { name: "<< outdents the line", doc: "    abc", keys: "<<", text: "  abc" },

  // --- insert mode ----------------------------------------------------------
  { name: "i inserts before the cursor", doc: "bc", keys: "ia<Esc>", text: "abc" },
  { name: "a inserts after the cursor", doc: "ac", keys: "ab<Esc>", text: "abc" },
  { name: "A appends at end of line", doc: "ab", keys: "Ac<Esc>", text: "abc" },
  { name: "I inserts at the first non-blank", doc: "  bc", keys: "Ia<Esc>", text: "  abc" },
  { name: "o opens a line below", doc: "one", keys: "otwo<Esc>", text: "one\ntwo" },
  { name: "O opens a line above", doc: "two", keys: "Oone<Esc>", text: "one\ntwo" },
  { name: "Esc leaves insert mode", doc: "ab", keys: "i<Esc>", text: "ab", mode: "normal" },
  { name: "i leaves the pad in insert mode", doc: "ab", keys: "i", text: "ab", mode: "insert" },
  { name: "R overwrites characters", doc: "abcd", keys: "RXY<Esc>", text: "XYcd" },

  // --- repeat ---------------------------------------------------------------
  { name: ". repeats the last change", doc: "a a a a", keys: "dw.", text: "a a" },
  { name: ". repeats an insert", doc: "x", keys: "ay<Esc>.", text: "xyy" },

  // --- undo -----------------------------------------------------------------
  { name: "u undoes a delete", doc: "abc", keys: "xu", text: "abc" },
  { name: "Ctrl-r redoes an undone change", doc: "abc", keys: "xu<C-r>", text: "bc" },
  { name: "3x then u restores all three characters", doc: "abcdef", keys: "3xu", text: "abcdef" },
  { name: "u undoes a whole insert session, not one character", doc: "one", keys: "ohi<Esc>u", text: "one" },
  { name: "u undoes an opened line and its text together", doc: "one", keys: "Ohi<Esc>u", text: "one" },
  { name: "u undoes a change operator and its insert together", doc: "alpha beta", keys: "ciwXY<Esc>u", text: "alpha beta" },

  // --- registers ------------------------------------------------------------
  {
    name: '"ayy then "ap uses the named register',
    doc: "one\ntwo",
    keys: '"ayyj"ap',
    text: "one\ntwo\none",
    needsLayout: true,
  },
  {
    name: '"0p pastes the last yank, not the last delete',
    doc: "keep\ndrop\ntarget",
    keys: 'yyjddj"0p',
    text: "keep\ntarget\nkeep",
    needsLayout: true,
  },
  { name: '"_dd deletes into the black hole register', doc: "a\nb", keys: 'yy"_ddp', text: "b\na" },

  // --- macros ---------------------------------------------------------------
  { name: "a recorded macro replays with @a", doc: "a\nb\nc\nd", keys: "qaddq@a", text: "c\nd" },
  { name: "@@ reruns the last macro", doc: "a\nb\nc\nd", keys: "qaddq@a@@", text: "d" },
  { name: "2@a replays a macro twice", doc: "a\nb\nc\nd", keys: "qaddq2@a", text: "d" },

  // --- marks ----------------------------------------------------------------
  { name: "ma then `a returns to the mark", doc: THREE, keys: "lmaG`a", text: THREE, cursor: "0:1" },
  { name: "d`a deletes to the mark", doc: "abcdef", keys: "3lmagg0d`a", text: "def" },

  // --- visual mode ----------------------------------------------------------
  { name: "vld deletes the two selected characters", doc: "abcdef", keys: "vld", text: "cdef" },
  { name: "Vd deletes the selected line", doc: "one\ntwo", keys: "Vd", text: "two" },
  { name: "viwd deletes the selected word", doc: WORDS, keys: "6lviwd", text: "alpha  gamma" },
  { name: "vU uppercases the selection", doc: "abc", keys: "vlU", text: "ABc" },
  { name: "V> indents the selected line", doc: "abc", keys: "V>", text: "  abc" },
  { name: "v enters visual mode", doc: "abc", keys: "v", text: "abc", mode: "visual" },
  { name: "V enters linewise visual mode", doc: "abc", keys: "V", text: "abc", mode: "visual-line" },
  { name: "Ctrl-v enters blockwise visual mode", doc: "abc", keys: "<C-v>", text: "abc", mode: "visual-block" },
  { name: "gv reselects the previous selection", doc: "abcdef", keys: "vl<Esc>gvd", text: "cdef" },
  {
    name: "Ctrl-v with I inserts on every selected line",
    doc: "aa\nbb\ncc",
    keys: "<C-v>jjIX<Esc>",
    text: "Xaa\nXbb\nXcc",
    needsLayout: true,
  },
  { name: "Ctrl-v jd deletes a column", doc: "abc\nabc", keys: "<C-v>jd", text: "bc\nbc", needsLayout: true },

  // --- search ---------------------------------------------------------------
  { name: "/ searches forward", doc: "aa\nline\nbb", keys: "/line<CR>", text: "aa\nline\nbb", cursor: "1:0" },
  {
    name: "n repeats the search",
    doc: "x\nhit\ny\nhit",
    keys: "/hit<CR>n",
    text: "x\nhit\ny\nhit",
    cursor: "3:0",
  },
  { name: "? searches backward", doc: "hit\nx\ny", keys: "G?hit<CR>", text: "hit\nx\ny", cursor: "0:0" },
  {
    name: "* searches for the word under the cursor",
    doc: "word\nx\nword",
    keys: "*",
    text: "word\nx\nword",
    cursor: "2:0",
  },
  { name: "d/pat deletes up to the match", doc: "abcXdef", keys: "d/X<CR>", text: "Xdef" },

  // --- ex commands ----------------------------------------------------------
  { name: ":s replaces on the current line", doc: "aaa", keys: ":s/a/b/<CR>", text: "baa" },
  { name: ":s with g replaces every match on the line", doc: "aaa", keys: ":s/a/b/g<CR>", text: "bbb" },
  { name: ":%s replaces throughout the file", doc: "a\na", keys: ":%s/a/b/g<CR>", text: "b\nb" },
  { name: ":d deletes the current line", doc: "one\ntwo", keys: ":d<CR>", text: "two" },
  { name: ":2 jumps to line 2", doc: THREE, keys: ":2<CR>", text: THREE, cursor: "1:0" },
  { name: ":sort orders the lines", doc: "c\na\nb", keys: ":sort<CR>", text: "a\nb\nc" },
  { name: ":g//d deletes matching lines", doc: "keep\ndrop x\nkeep", keys: ":g/drop/d<CR>", text: "keep\nkeep" },
];
