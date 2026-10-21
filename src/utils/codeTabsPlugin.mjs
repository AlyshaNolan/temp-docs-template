// `<CodeTabs><CodeTab label language highlight>` + a fenced block per tab is the
// MDX authoring form, because CloudCannon writes a multi-line `code` string prop
// with raw newlines MDX can't parse. This rewrites it to the `tabs` prop the
// component takes. Keep in step with `code-tabs.cloudcannon.snippets.yml`.
const TAB_KEYS = ["label", "language", "highlight"];

function readTab(element) {
  const tab = {};

  for (const attribute of element.attributes) {
    if (
      attribute.type === "mdxJsxAttribute" &&
      TAB_KEYS.includes(attribute.name) &&
      typeof attribute.value === "string"
    ) {
      tab[attribute.name] = attribute.value;
    }
  }
  const fence = element.children.find((child) => child.type === "code");

  if (!tab.language && fence?.lang) tab.language = fence.lang;
  tab.code = fence?.value ?? "";
  return tab;
}

/** Sätteri mdast plugin: folds `<CodeTab>` children into `<CodeTabs tabs={…}>`. */
export const codeTabsPlugin = {
  name: "code-tabs",
  mdxJsxFlowElement(node, ctx) {
    if (node.name !== "CodeTabs") return;
    const tabElements = node.children.filter(
      (child) => child.type === "mdxJsxFlowElement" && child.name === "CodeTab"
    );

    if (tabElements.length === 0) return;

    ctx.replaceNode(node, {
      ...node,
      attributes: [
        ...node.attributes.filter((attribute) => attribute.name !== "tabs"),
        {
          type: "mdxJsxAttribute",
          name: "tabs",
          value: {
            type: "mdxJsxAttributeValueExpression",
            value: JSON.stringify(tabElements.map(readTab)),
          },
        },
      ],
      children: [],
    });
  },
};
