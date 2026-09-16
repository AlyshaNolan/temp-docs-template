import { describe, expect, it } from "vitest";
import { comparePages, orderGroupNames } from "../../src/utils/navOrder";

const page = (order: number, title: string) => ({ order, title });

describe("comparePages", () => {
  it("orders by the `order` frontmatter first", () => {
    expect(comparePages(page(1, "Zebra"), page(2, "Alpha"))).toBeLessThan(0);
  });

  it("falls back to title when the order matches", () => {
    expect(comparePages(page(1, "Alpha"), page(1, "Zebra"))).toBeLessThan(0);
    expect(comparePages(page(1, "Zebra"), page(1, "Alpha"))).toBeGreaterThan(0);
  });

  it("sorts a list the way the sidebar renders it", () => {
    const pages = [page(2, "B"), page(0, "C"), page(2, "A"), page(1, "D")];

    expect([...pages].sort(comparePages).map((entry) => entry.title)).toEqual(["C", "D", "A", "B"]);
  });
});

describe("orderGroupNames", () => {
  it("keeps the configured order", () => {
    expect(orderGroupNames(["Two", "One"], ["One", "Two"])).toEqual(["Two", "One"]);
  });

  it("drops a configured group that no page belongs to", () => {
    expect(orderGroupNames(["One", "Empty"], ["One"])).toEqual(["One"]);
  });

  it("appends unconfigured groups alphabetically after the configured ones", () => {
    expect(orderGroupNames(["Zed"], ["Zed", "Beta", "Alpha"])).toEqual(["Zed", "Alpha", "Beta"]);
  });

  // Renaming a `navGroups` entry cannot rename a group: membership comes from
  // each page's `group`, so the old name reappears in the alphabetical tail.
  it("orphans a renamed group into the tail rather than renaming it", () => {
    expect(orderGroupNames(["Renamed", "Reference"], ["Authoring", "Reference"])).toEqual([
      "Reference",
      "Authoring",
    ]);
  });

  it("returns nothing when no group has pages", () => {
    expect(orderGroupNames(["One", "Two"], [])).toEqual([]);
  });
});
