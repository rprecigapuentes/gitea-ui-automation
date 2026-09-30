import { routeTemplate } from "./route-template.mjs";

export function collectElements() {
  const { document } = globalThis;
  const selector =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=menuitem], [role=tab], [role=checkbox], .ui.dropdown:not(.disabled)";
  const roles = { A: "link", BUTTON: "button", SELECT: "combobox", SUMMARY: "button" };
  const inputs = { checkbox: "checkbox", radio: "radio", submit: "button", button: "button" };
  const clean = (value) => (value ?? "").trim().replace(/\s+/g, " ");

  function nameOf(element, role) {
    const editable = ["INPUT", "TEXTAREA"].includes(element.tagName);
    const choice = role === "checkbox" || role === "radio";
    const icon = element
      .querySelector("svg[class*='octicon-']")
      ?.getAttribute("class")
      .match(/octicon-([\w-]+)/)?.[1];
    const sources = [
      element.getAttribute("aria-label"),
      document.getElementById(element.getAttribute("aria-labelledby"))?.innerText,
      element.labels?.[0]?.innerText,
      choice ? element.closest(".ui.checkbox, label")?.innerText : "",
      role === "dropdown" ? element.querySelector("input[name]")?.getAttribute("name") : "",
      editable ? "" : element.innerText,
      element.getAttribute("placeholder"),
      element.getAttribute("title"),
      element.getAttribute("data-tooltip-content"),
      element.tagName === "INPUT" && role === "button" ? element.value : "",
      icon ? `${icon} icon` : "",
      element.getAttribute("name"),
      element.id,
    ];

    return clean(sources.find((value) => clean(value) !== "")).slice(0, 60);
  }

  return [...document.querySelectorAll(selector)].map((element, index) => {
    element.setAttribute("data-cov", index);
    const editable = ["INPUT", "TEXTAREA"].includes(element.tagName);
    const role = element.matches(".ui.dropdown")
      ? "dropdown"
      : (roles[element.tagName] ??
        inputs[element.getAttribute("type")] ??
        (editable ? "textbox" : (element.getAttribute("role") ?? "other")));

    return { role, name: nameOf(element, role), href: element.getAttribute("href") };
  });
}

const HASH = /\b(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/g;
const TIME = /\b(?:an?|less than a|\d+) (?:second|minute|hour|day|week|month|year)s? ago\b/g;

function normalise(name, replacements) {
  let value = name;

  for (const [actual, placeholder] of replacements) value = value.split(actual).join(placeholder);
  return value.replace(HASH, "{hash}").replace(TIME, "{time}").replace(/\d+/g, "N").trim();
}

export function describe({ role, name, href }, pageUrl, replacements = []) {
  const clean = normalise(name, replacements);
  if (role !== "link" || href === null) return { type: role, name: clean };

  const target = routeTemplate(new URL(href, pageUrl).pathname);
  return { type: "link", name: clean === "" ? target : clean, target };
}

export function withOrdinals(elements) {
  const seen = new Map();

  return elements.map((element) => {
    const identity = `${element.type}|${element.name}|${element.target ?? ""}`;
    const ordinal = (seen.get(identity) ?? 0) + 1;
    seen.set(identity, ordinal);
    return { ...element, ordinal };
  });
}

export const keyOf = ({ type, name, target, ordinal }) =>
  `${type}|${name}|${target ?? ""}|${ordinal}`;

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
