// The states a page-object method proves by being used: a click implies visible and enabled. When
// in doubt only `visible` counts, so the figure stays a floor.
const INTERACTIONS = /^(click|type|clearAndType|dragAndDrop|clickAnd|typeAnd|actAnd)/;

export function impliedStates(action = "") {
  if (INTERACTIONS.test(action)) return ["visible", "enabled"];
  if (/checked|selected/i.test(action)) return ["visible", "checked", "unchecked"];
  if (/disabled|enabled/i.test(action)) return ["visible", "enabled", "disabled"];
  if (/expanded/i.test(action)) return ["visible", "expanded", "collapsed"];
  return ["visible"];
}
