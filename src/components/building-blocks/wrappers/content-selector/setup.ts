/**
 * Panel switching is pure CSS; this syncs aria state, adds Enter/Space to the
 * `<label>` tabs and restores the choice after an editor re-render. Also
 * registered in `editor-live-sync.js`: the editor strips inline scripts.
 */

// The editor's re-render can replace the radios, which arrive with the first
// one checked. The outer section survives it, so the choice is kept against that.
const selectedIndex = new WeakMap<HTMLElement, number>();
const observed = new WeakSet<HTMLElement>();

function stateOwner(contentSelector: HTMLElement): HTMLElement {
  return contentSelector.closest<HTMLElement>(".content-selector") ?? contentSelector;
}

function getInputs(contentSelector: HTMLElement): HTMLInputElement[] {
  return Array.from(
    contentSelector.querySelectorAll<HTMLInputElement>(".content-selector-input")
  ).filter((input) => input.closest(".content-selector-items") === contentSelector);
}

function setAttributeIfChanged(element: Element, name: string, value: string): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function updatePanelAriaState(input: HTMLInputElement, isSelected: boolean): void {
  const tab = input.nextElementSibling;
  const panel = tab?.nextElementSibling;

  if (!(tab instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;

  setAttributeIfChanged(tab, "aria-expanded", isSelected.toString());
  setAttributeIfChanged(panel, "aria-hidden", (!isSelected).toString());
}

function syncContentSelectorAriaState(contentSelector: HTMLElement): void {
  const inputs = getInputs(contentSelector);

  if (!inputs.length) return;

  const remembered = selectedIndex.get(stateOwner(contentSelector));
  let selectedInput =
    remembered === undefined
      ? inputs.find((input) => input.checked)
      : inputs[Math.min(remembered, inputs.length - 1)];

  selectedInput ??= inputs[0];
  if (!selectedInput.checked) selectedInput.checked = true;

  inputs.forEach((input) => {
    updatePanelAriaState(input, input === selectedInput);
  });
}

function handleInputChange(event: Event): void {
  const input = event.target;

  if (!(input instanceof HTMLInputElement) || !input.matches(".content-selector-input")) return;

  const contentSelector = input.closest(".content-selector-items");

  if (!(contentSelector instanceof HTMLElement)) return;

  selectedIndex.set(stateOwner(contentSelector), getInputs(contentSelector).indexOf(input));
  syncContentSelectorAriaState(contentSelector);
}

function handleTabKeydown(event: Event): void {
  if (!(event instanceof KeyboardEvent)) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  const tab = event.target;

  if (!(tab instanceof HTMLLabelElement) || !tab.matches(".content-selector-tab")) return;

  event.preventDefault();

  const inputId = tab.getAttribute("for");
  const input = inputId ? document.getElementById(inputId) : null;

  if (!(input instanceof HTMLInputElement)) return;

  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

let isolatedGroupCount = 0;

// Panels written as MDX children can't receive the selector's group name, so
// every such selector on a page shares the default one — and one radio group.
function isolateRadioGroup(contentSelector: HTMLElement): void {
  const inputs = getInputs(contentSelector);
  const owner = stateOwner(contentSelector);
  const isolated = owner.dataset.radioGroup;

  if (isolated) {
    inputs.forEach((input) => {
      if (input.name !== isolated) input.name = isolated;
    });
    return;
  }

  const name = inputs[0]?.name;

  if (!name || document.getElementsByName(name).length <= inputs.length) return;

  owner.dataset.radioGroup = `${name}-${++isolatedGroupCount}`;
  inputs.forEach((input) => {
    input.name = owner.dataset.radioGroup as string;
  });
}

function findContentSelector(owner: HTMLElement): HTMLElement | null {
  return owner.matches(".content-selector-items")
    ? owner
    : owner.querySelector<HTMLElement>(".content-selector-items");
}

export function setupContentSelector(contentSelector: HTMLElement): void {
  const owner = stateOwner(contentSelector);

  isolateRadioGroup(contentSelector);
  syncContentSelectorAriaState(contentSelector);

  if (observed.has(owner)) return;
  observed.add(owner);

  const initial = getInputs(contentSelector).findIndex((input) => input.checked);

  selectedIndex.set(owner, Math.max(initial, 0));

  owner.addEventListener("change", handleInputChange);
  owner.addEventListener("keydown", handleTabKeydown);

  new MutationObserver(() => {
    const current = findContentSelector(owner);

    if (!current) return;

    isolateRadioGroup(current);
    syncContentSelectorAriaState(current);
  }).observe(owner, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["checked", "name", "aria-expanded", "aria-hidden"],
  });
}

export function setupAllContentSelectors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(".content-selector-items").forEach((contentSelector) => {
    setupContentSelector(contentSelector);
  });
}
