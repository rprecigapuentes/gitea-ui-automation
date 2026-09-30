import { routeTemplate } from "./route-template.mjs";

export function collectElements() {
  const { document } = globalThis;
  const selector =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=menuitem], [role=tab], [role=checkbox]";
  const roles = { A: "link", BUTTON: "button", SELECT: "combobox", SUMMARY: "button" };
  const inputs = { checkbox: "checkbox", radio: "radio", submit: "button", button: "button" };

  return [...document.querySelectorAll(selector)].map((element, index) => {
    element.setAttribute("data-cov", index);
    const editable = ["INPUT", "TEXTAREA"].includes(element.tagName);
    const role =
      roles[element.tagName] ??
      inputs[element.getAttribute("type")] ??
      (editable ? "textbox" : element.getAttribute("role"));
    const label =
      element.getAttribute("aria-label") ||
      (editable ? "" : element.innerText) ||
      element.placeholder ||
      element.title ||
      element.getAttribute("name") ||
      "";

    const name = label.trim().replace(/\s+/g, " ").slice(0, 60);

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
