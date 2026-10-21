// In MDX, `CodeBlock` and each `CodeTab` hold their sample in a fenced block
// between the tags, because CloudCannon writes a multi-line string prop with raw
// newlines MDX can't parse. This folds the fence back into the props the
// components take. Keep in step with the code-block and code-tabs snippets.
const TAB_KEYS = ["label", "language", "highlight"];

const expressionAttribute = (name, value) => ({
  type: "mdxJsxAttribute",
  name,
  value: { type: "mdxJsxAttributeValueExpression", value: JSON.stringify(value) },
});

const findFence = (element) => element.children.find((child) => child.type === "code");

const hasAttribute = (element, name) =>
  element.attributes.some((attribute) => attribute.name === name);

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
  const fence = findFence(element);

  if (!tab.language && fence?.lang) tab.language = fence.lang;
  tab.code = fence?.value ?? "";

  return tab;
}

function foldCodeTabs(node, ctx) {
  const tabElements = node.children.filter(
    (child) => child.type === "mdxJsxFlowElement" && child.name === "CodeTab"
  );

  if (tabElements.length === 0) return;

  ctx.replaceNode(node, {
    ...node,
    attributes: [
      ...node.attributes.filter((attribute) => attribute.name !== "tabs"),
      expressionAttribute("tabs", tabElements.map(readTab)),
    ],
    children: [],
  });
}

function foldCodeBlock(node, ctx) {
  const fence = findFence(node);

  if (!fence) return;

  const attributes = node.attributes.filter((attribute) => attribute.name !== "code");

  attributes.push(expressionAttribute("code", fence.value));
  if (fence.lang && !hasAttribute(node, "language")) {
    attributes.push(expressionAttribute("language", fence.lang));
  }

  ctx.replaceNode(node, { ...node, attributes, children: [] });
}

/** Sätteri mdast plugin: turns the fence inside `CodeBlock` / `CodeTab` into props. */
export const codeFencePlugin = {
  name: "code-fence-props",
  mdxJsxFlowElement(node, ctx) {
    if (node.name === "CodeTabs") foldCodeTabs(node, ctx);
    else if (node.name === "CodeBlock") foldCodeBlock(node, ctx);
  },
};
