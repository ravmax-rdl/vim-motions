/**
 * jsdom has no layout engine, so CodeMirror's coordinate measurement returns
 * nothing and vertical motions (j, k, G, Ctrl-d) fail. This models the editor as
 * a fixed monospace grid so those motions resolve to real positions in tests.
 *
 * CHAR_W and LINE_H must match the defaults CodeMirror falls back to when it
 * cannot measure (7x14). If they drift apart, its height map and these rects
 * disagree and every vertical motion lands on the wrong line.
 *
 * Line indexes are resolved within the owning .cm-content, never by a global
 * query: CodeMirror appends detached .cm-line elements while measuring, and a
 * document-wide lookup counts those and skews every coordinate.
 */
const CHAR_W = 7;
const LINE_H = 14;

function closest(node: Node | null, className: string): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.classList.contains(className)) return current;
    current = current.parentNode;
  }
  return null;
}

function linesOf(content: HTMLElement): HTMLElement[] {
  return Array.from(content.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.classList.contains("cm-line"),
  );
}

/** Row index of a .cm-line within its own editor, or 0 when detached. */
function rowOf(line: HTMLElement): number {
  const content = closest(line.parentNode, "cm-content");
  if (!content) return 0;
  return Math.max(0, linesOf(content).indexOf(line));
}

/** Character offset of `node`/`offset` measured from the start of its .cm-line. */
function offsetInLine(line: HTMLElement, node: Node, offset: number): number {
  if (node === line) {
    let count = 0;
    for (let i = 0; i < offset && i < line.childNodes.length; i++) {
      count += line.childNodes[i].textContent?.length ?? 0;
    }
    return count;
  }
  const walker = (line.ownerDocument ?? document).createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let total = 0;
  let text: Node | null;
  while ((text = walker.nextNode())) {
    if (text === node) return total + offset;
    total += text.nodeValue?.length ?? 0;
  }
  return total;
}

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    bottom: y + height,
    left: x,
    right: x + width,
    toJSON: () => ({}),
  } as DOMRect;
}

function rectList(rects: DOMRect[]): DOMRectList {
  const list = rects as unknown as DOMRectList & DOMRect[];
  list.item = (i: number) => rects[i] ?? null;
  return list;
}

function rangeRect(range: Range): DOMRect {
  const line = closest(range.startContainer, "cm-line");
  if (!line) return rect(0, 0, 0, LINE_H);
  const row = rowOf(line);
  const start = offsetInLine(line, range.startContainer, range.startOffset);
  const endLine = closest(range.endContainer, "cm-line");
  const end = endLine === line ? offsetInLine(line, range.endContainer, range.endOffset) : start;
  return rect(start * CHAR_W, row * LINE_H, Math.max(0, end - start) * CHAR_W, LINE_H);
}

function elementRect(el: HTMLElement): DOMRect {
  if (el.classList?.contains("cm-line")) {
    return rect(0, rowOf(el) * LINE_H, (el.textContent?.length ?? 0) * CHAR_W, LINE_H);
  }
  const content = el.classList?.contains("cm-content") ? el : el.querySelector(".cm-content");
  if (content instanceof HTMLElement) {
    const lines = linesOf(content);
    const width = lines.reduce((max, l) => Math.max(max, l.textContent?.length ?? 0), 0) * CHAR_W;
    return rect(0, 0, Math.max(CHAR_W, width), Math.max(LINE_H, lines.length * LINE_H));
  }
  return rect(0, 0, 600, LINE_H * 20);
}

Range.prototype.getClientRects = function (this: Range) {
  return rectList([rangeRect(this)]);
};
Range.prototype.getBoundingClientRect = function (this: Range) {
  return rangeRect(this);
};

Element.prototype.getBoundingClientRect = function (this: Element) {
  return elementRect(this as HTMLElement);
};
Element.prototype.getClientRects = function (this: Element) {
  return rectList([elementRect(this as HTMLElement)]);
};

for (const [prop, value] of [
  ["offsetHeight", LINE_H],
  ["offsetWidth", 600],
  ["clientHeight", LINE_H * 20],
  ["clientWidth", 600],
] as const) {
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    get() {
      return value;
    },
  });
}

// CodeMirror scrolls the cursor into view after most commands; jsdom throws.
window.scrollBy = () => {};
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
