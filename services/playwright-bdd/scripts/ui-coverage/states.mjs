const INTERACTIONS = /^(click|type|clearAndType|dragAndDrop|clickAnd|typeAnd|actAnd)/;

export function impliedStates(action = "") {
  if (INTERACTIONS.test(action)) return ["visible", "enabled"];
  if (/checked|selected/i.test(action)) return ["visible", "checked", "unchecked"];
  if (/disabled|enabled/i.test(action)) return ["visible", "enabled", "disabled"];
  if (/expanded/i.test(action)) return ["visible", "expanded", "collapsed"];
  return ["visible"];
}
