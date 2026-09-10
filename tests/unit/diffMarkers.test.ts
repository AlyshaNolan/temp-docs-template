import { describe, expect, it } from "vitest";
import { parseDiffMarkers } from "../../src/components/utils/highlight";

describe("parseDiffMarkers", () => {
  it("strips the marker and keys it by 1-based line", () => {
    const { lines, diff } = parseDiffMarkers("a\n-  b\n+  c\n~  d");

    expect(lines).toEqual(["a", "  b", "  c", "  d"]);
    expect([...diff]).toEqual([
      [2, "remove"],
      [3, "add"],
      [4, "highlight"],
    ]);
  });

  it("only reads the first character, so markers mid-line are code", () => {
    const { lines, diff } = parseDiffMarkers("total = a + b");

    expect(lines).toEqual(["total = a + b"]);
    expect(diff.size).toBe(0);
  });

  it("ignores an indented marker — the column is the whole signal", () => {
    const { diff } = parseDiffMarkers("  + not a marker");

    expect(diff.size).toBe(0);
  });

  it("preserveColumns swaps the marker for a space so indentation survives", () => {
    const { lines, diff } = parseDiffMarkers("src/\n+   a\n    b", {
      preserveColumns: true,
    });

    expect(lines).toEqual(["src/", "    a", "    b"]);
    expect([...diff]).toEqual([[2, "add"]]);
  });
});
