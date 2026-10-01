// Reads the `locators` object of every page object with the TypeScript compiler, so a selector is
// found by parsing its declaration and never by running the page object.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

export const PAGES = path.resolve(import.meta.dirname, "../../../../business-logic/pages");

const OPEN = "@@OPEN@@";
const WHOLE_VALUE = /\[([\w-]+)[~|^$*]?=(["'])@@OPEN@@\2\]/g;

function text(node, constants, open = false) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isIdentifier(node) && constants.has(node.text)) return constants.get(node.text);
  if (!ts.isTemplateExpression(node)) return open ? OPEN : undefined;

  const parts = node.templateSpans.map((span) => [
    text(span.expression, constants, open),
    span.literal.text,
  ]);
  if (parts.some(([value]) => value === undefined)) return undefined;
  return node.head.text + parts.map(([value, tail]) => value + tail).join("");
}

/** A value that only a run supplies is left open when it is a whole attribute value or a leading
 *  ancestor, and the selector is dropped when anything else stays open. */
function dynamic(node, constants) {
  const raw = text(node, constants, true);
  if (raw === undefined) return undefined;

  const closed = raw.replace(WHOLE_VALUE, "[$1]").replace(/^@@OPEN@@\s*/, "");
  if (closed === "" || closed.includes(OPEN)) return undefined;

  return closed;
}

function constantsOf(source) {
  const constants = new Map();

  for (const statement of source.statements.filter(ts.isVariableStatement)) {
    for (const { name, initializer } of statement.declarationList.declarations) {
      const value = initializer && text(initializer, constants);
      if (value !== undefined) constants.set(name.text, value);
    }
  }

  return constants;
}

function returned(node) {
  if (
    !ts.isArrowFunction(node) &&
    !ts.isFunctionExpression(node) &&
    !ts.isMethodDeclaration(node)
  ) {
    return node;
  }
  if (!ts.isBlock(node.body ?? node)) return node.body;

  return node.body.statements.find(ts.isReturnStatement)?.expression;
}

function selectorsOf(literal, constants) {
  const selectors = new Map();

  for (const property of literal.properties) {
    const value = ts.isShorthandPropertyAssignment(property)
      ? constants.get(property.name.text)
      : dynamic(returned(property.initializer) ?? property.initializer, constants);
    if (value !== undefined) selectors.set(property.name.text, value);
  }

  return selectors;
}

function referencesOf(node) {
  const refs = { self: [], pairs: [] };

  const onThis = (expression) =>
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.kind === ts.SyntaxKind.ThisKeyword;

  const visit = (child, action) => {
    if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression)) {
      visit(child.expression, action);
      child.arguments.forEach((argument) => visit(argument, child.expression.name.text));
      return;
    }
    if (ts.isPropertyAccessExpression(child)) {
      const { expression, name } = child;
      if (expression.kind === ts.SyntaxKind.ThisKeyword) refs.self.push([name.text, action]);
      if (onThis(expression)) refs.pairs.push([expression.name.text, name.text, action]);
    }
    ts.forEachChild(child, (grandchild) => visit(grandchild, action));
  };

  visit(node);
  return refs;
}

function assignedLiterals(constructor) {
  return constructor.body.statements
    .filter(ts.isExpressionStatement)
    .map((statement) => statement.expression)
    .filter(
      (expression) =>
        ts.isBinaryExpression(expression) &&
        ts.isPropertyAccessExpression(expression.left) &&
        expression.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
        ts.isObjectLiteralExpression(expression.right),
    );
}

function factsOf(declaration, constants) {
  const facts = { selectors: new Map(), types: new Map(), members: new Map(), returns: new Map() };

  for (const member of declaration.members) {
    if (ts.isConstructorDeclaration(member) && member.body) {
      for (const { left, right } of assignedLiterals(member)) {
        facts.selectors.set(left.name.text, selectorsOf(right, constants));
      }
    }
    if (!member.name || !ts.isIdentifier(member.name)) continue;
    const name = member.name.text;
    const body = ts.isMethodDeclaration(member) ? member.body : member.initializer;

    if (body && ts.isObjectLiteralExpression(body)) {
      facts.selectors.set(name, selectorsOf(body, constants));
    }
    if (ts.isPropertyDeclaration(member) && member.type && ts.isTypeReferenceNode(member.type)) {
      facts.types.set(name, member.type.typeName.text);
    }
    if (ts.isMethodDeclaration(member) && member.type?.kind === ts.SyntaxKind.StringKeyword) {
      const value = name !== "getUrl" && dynamic(returned(member) ?? member.body, constants);
      if (value) facts.returns.set(name, value);
    }
    if (body) facts.members.set(name, referencesOf(body));
  }

  return facts;
}

export function parsePageObjects() {
  const classes = new Map();
  const files = readdirSync(PAGES, { recursive: true }).filter((file) => file.endsWith(".ts"));

  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(path.join(PAGES, file), "utf8"),
      ts.ScriptTarget.ES2022,
    );
    const constants = constantsOf(source);

    for (const declaration of source.statements.filter(ts.isClassDeclaration)) {
      classes.set(declaration.name.text, factsOf(declaration, constants));
    }
  }

  return classes;
}

export function selectorsReachedBy(
  classes,
  className,
  member,
  found = new Map(),
  seen = new Set(),
  inherited,
) {
  const key = `${className}.${member}`;
  const facts = classes.get(className);
  const refs = facts?.members.get(member);
  if (!refs || seen.has(key)) return found;
  seen.add(key);

  const add = (selector, action) => {
    const used = action ?? inherited;
    found.set(`${selector}|${used}`, { selector, action: used, owner: className });
  };

  for (const [property, name, action] of refs.pairs) {
    const selector = facts.selectors.get(property)?.get(name);
    if (selector) add(selector, action);
    const target = facts.types.get(property);
    if (target) selectorsReachedBy(classes, target, name, found, seen, action ?? inherited);
  }
  for (const [name, action] of refs.self) {
    if (facts.returns.has(name)) add(facts.returns.get(name), action);
    selectorsReachedBy(classes, className, name, found, seen, action ?? inherited);
  }

  return found;
}
