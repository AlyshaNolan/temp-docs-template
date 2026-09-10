/**
 * Turns an indented list of paths into the box-drawing tree a reader sees.
 *
 * Depth comes from leading whitespace measured against a stack of the enclosing
 * indents, so any consistent unit works (two spaces, four, tabs) and a line
 * indented past its parent by any amount is that parent's child. Blank lines
 * are dropped: a gap in the source would otherwise read as a node.
 */
const INDENT = "   ";
const CONTINUE = "│  ";
const BRANCH = "├─ ";
const LAST = "└─ ";

const indentWidth = (line: string) => line.length - line.trimStart().length;

/** Renders one connector-prefixed line per non-blank entry in `lines`. */
export function drawFileTree(lines: string[]): string[] {
  const nodes: { depth: number; label: string }[] = [];
  const indents: number[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const width = indentWidth(line);

    while (indents.length && width <= indents[indents.length - 1]!) indents.pop();

    nodes.push({ depth: indents.length, label: line.trim() });
    indents.push(width);
  }

  return nodes.map(({ depth, label }, index) => {
    let prefix = "";

    for (let level = 0; level < depth - 1; level += 1) {
      prefix += hasLaterSibling(nodes, index, level + 1) ? CONTINUE : INDENT;
    }

    if (depth > 0) prefix += hasLaterSibling(nodes, index, depth) ? BRANCH : LAST;

    return prefix + label;
  });
}

/**
 * Whether the ancestor at `depth` has another child below `index` — the test
 * for both `│` continuation and `├─` vs `└─`. A node shallower than `depth`
 * closes that branch, so the scan stops there.
 */
function hasLaterSibling(nodes: { depth: number }[], index: number, depth: number): boolean {
  for (let next = index + 1; next < nodes.length; next += 1) {
    if (nodes[next]!.depth < depth) return false;
    if (nodes[next]!.depth === depth) return true;
  }

  return false;
}
