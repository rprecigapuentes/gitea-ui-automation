import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CucumberExpression, ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import ts from "typescript";

const FEATURES = path.resolve(import.meta.dirname, "../../features");
const KEYWORDS = new Set(["Given", "When", "Then"]);

const textOf = (source, node) => source.text.slice(node.getStart(source), node.end);

function callsIn(text) {
  return [...text.matchAll(/pageObjects\.(\w+)\.(\w+)/g)].map(([, getter, member]) => [
    getter,
    member,
  ]);
}

function helpersOf(source) {
  const helpers = new Map();

  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      helpers.set(statement.name.text, callsIn(textOf(source, statement)));
    }
  }

  return helpers;
}

function definitionsOf(file) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ES2022);
  const helpers = helpersOf(source);
  const definitions = [];

  for (const statement of source.statements) {
    const call = ts.isExpressionStatement(statement) ? statement.expression : undefined;
    if (!call || !ts.isCallExpression(call) || !KEYWORDS.has(call.expression.text)) continue;

    const text = textOf(source, statement);
    const viaHelpers = [...helpers]
      .filter(([name]) => new RegExp(`\\b${name}\\(`).test(text))
      .flatMap(([, calls]) => calls);

    definitions.push({ pattern: call.arguments[0].text, calls: [...callsIn(text), ...viaHelpers] });
  }

  return definitions;
}

export function stepDefinitions() {
  const directory = path.join(FEATURES, "step-definitions");
  return readdirSync(directory).flatMap((file) => definitionsOf(path.join(directory, file)));
}

function parse(text) {
  const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
  return parser.parse(text).feature;
}

function scenarios() {
  const directory = path.join(FEATURES, "scenarios");

  return readdirSync(directory).flatMap((file) => {
    const feature = parse(readFileSync(path.join(directory, file), "utf8"));
    const background = feature.children.find((child) => child.background)?.background.steps ?? [];

    return feature.children
      .filter((child) => child.scenario)
      .map(({ scenario }) => ({
        name: `${feature.name}: ${scenario.name}`,
        steps: [...background, ...scenario.steps].map((step) => step.text),
      }));
  });
}

function expressionOf(pattern) {
  try {
    return new CucumberExpression(pattern, new ParameterTypeRegistry());
  } catch {
    return undefined;
  }
}

export function testsByPattern(definitions) {
  const tests = new Map(definitions.map(({ pattern }) => [pattern, new Set()]));
  const expressions = definitions.map(({ pattern }) => [pattern, expressionOf(pattern)]);

  for (const { name, steps } of scenarios()) {
    for (const text of steps) {
      const found = expressions.find(([, expression]) => expression?.match(text));
      if (found) tests.get(found[0]).add(name);
    }
  }

  return tests;
}
