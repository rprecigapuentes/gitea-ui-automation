import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

export const PAGES = path.resolve(import.meta.dirname, "../../../business-logic/pages");

function text(node, constants) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isIdentifier(node)) return constants.get(node.text);
  if (!ts.isTemplateExpression(node)) return undefined;

  const parts = node.templateSpans.map((span) => [
    text(span.expression, constants),
    span.literal.text,
  ]);
  if (parts.some(([value]) => value === undefined)) return undefined;
  return node.head.text + parts.map(([value, tail]) => value + tail).join("");
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

function selectorsOf(literal, constants) {
  const selectors = new Map();

  for (const property of literal.properties) {
    const value = ts.isShorthandPropertyAssignment(property)
      ? constants.get(property.name.text)
      : text(property.initializer, constants);
    if (value !== undefined) selectors.set(property.name.text, value);
  }

  return selectors;
}

function referencesOf(node) {
  const refs = { self: new Set(), pairs: [] };

  const onThis = (expression) =>
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.kind === ts.SyntaxKind.ThisKeyword;

  const visit = (child, action) => {
    let next = action;
    if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression)) {
      next = child.expression.name.text;
    }
    if (ts.isPropertyAccessExpression(child)) {
      const { expression, name } = child;
      if (expression.kind === ts.SyntaxKind.ThisKeyword) refs.self.add(name.text);
      if (onThis(expression)) refs.pairs.push([expression.name.text, name.text, action]);
    }
    ts.forEachChild(child, (grandchild) => visit(grandchild, next));
  };

  visit(node);
  return refs;
}

function factsOf(declaration, constants) {
  const facts = { selectors: new Map(), types: new Map(), members: new Map() };

  for (const member of declaration.members) {
    if (!member.name || !ts.isIdentifier(member.name)) continue;
    const name = member.name.text;
    const body = ts.isMethodDeclaration(member) ? member.body : member.initializer;

    if (body && ts.isObjectLiteralExpression(body))
      facts.selectors.set(name, selectorsOf(body, constants));
    if (ts.isPropertyDeclaration(member) && member.type && ts.isTypeReferenceNode(member.type)) {
      facts.types.set(name, member.type.typeName.text);
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
) {
  const key = `${className}.${member}`;
  const facts = classes.get(className);
  const refs = facts?.members.get(member);
  if (!refs || seen.has(key)) return found;
  seen.add(key);

  for (const [property, name, action] of refs.pairs) {
    const selector = facts.selectors.get(property)?.get(name);
    if (selector) found.set(`${selector}|${action}`, { selector, action });
    const target = facts.types.get(property);
    if (target) selectorsReachedBy(classes, target, name, found, seen);
  }
  for (const name of refs.self) selectorsReachedBy(classes, className, name, found, seen);

  return found;
}
