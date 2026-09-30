export const ACTIONS_BY_ROLE = {
  link: ["click"],
  button: ["click"],
  menuitem: ["click"],
  tab: ["click"],
  other: ["click"],
  dropdown: ["open"],
  textbox: ["fill", "clear"],
  checkbox: ["toggle"],
  radio: ["choose"],
  combobox: ["choose"],
};

export const possibleActions = (type) => ACTIONS_BY_ROLE[type] ?? [];

export function performedActions(method = "") {
  if (method.startsWith("click")) return ["click", "open", "toggle", "choose"];
  if (method === "clearAndType") return ["fill", "clear"];
  if (method.startsWith("type")) return ["fill"];
  return [];
}
