import { routeTemplate } from "./route-template.mjs";

export function collectElements() {
  const { document } = globalThis;
  const selector =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=menuitem], [role=tab], [role=checkbox], .ui.dropdown:not(.disabled)";
  const roles = { A: "link", BUTTON: "button", SELECT: "combobox", SUMMARY: "button" };
  const inputs = { checkbox: "checkbox", radio: "radio", submit: "button", button: "button" };

  return [...document.querySelectorAll(selector)].map((element, index) => {
    element.setAttribute("data-cov", index);
    const editable = ["INPUT", "TEXTAREA"].includes(element.tagName);
    const role = element.matches(".ui.dropdown")
      ? "dropdown"
      : (roles[element.tagName] ??
        inputs[element.getAttribute("type")] ??
        (editable ? "textbox" : (element.getAttribute("role") ?? "other")));
    const label =
      element.getAttribute("aria-label") ||
      (editable ? "" : element.innerText) ||
      element.placeholder ||
      element.title ||
      element.getAttribute("name") ||
      "";

    const name = role === "dropdown" ? "" : label.trim().replace(/\s+/g, " ").slice(0, 60);

    return { role, name, href: element.getAttribute("href") };
  });
}

export function keyOf({ role, name, href }, pageUrl) {
  if (role !== "link" || href === null) return `${role}:${name}`;
  return `link:${routeTemplate(new URL(href, pageUrl).pathname)}`;
}

export function withOrdinals(keys) {
  const seen = new Map();

  return keys.map((key) => {
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    return count === 1 ? key : `${key}#${count}`;
  });
}

export function readStates() {
  const { document, getComputedStyle } = globalThis;

  return [...document.querySelectorAll("[data-cov]")].map((element) => {
    const states = [];
    const shown =
      element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
    const expanded = element.getAttribute("aria-expanded");

    if (shown) states.push("visible");
    states.push(
      element.matches(":disabled, [aria-disabled=true], .disabled") ? "disabled" : "enabled",
    );
    if (element.matches("input[type=checkbox], input[type=radio]")) {
      states.push(element.checked ? "checked" : "unchecked");
    }
    if (expanded !== null) states.push(expanded === "true" ? "expanded" : "collapsed");

    return [Number(element.dataset.cov), states];
  });
}

export function openMenus() {
  const { document } = globalThis;
  const style = document.createElement("style");

  style.textContent =
    ".ui.dropdown .menu { display: block !important; visibility: visible !important; opacity: 1 !important; }";
  document.head.append(style);
  document.querySelectorAll("details").forEach((details) => {
    details.open = true;
  });
}
