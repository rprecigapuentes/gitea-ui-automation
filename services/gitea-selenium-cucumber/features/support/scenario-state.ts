import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";
import type { SeededLabel } from "@gitea-automation/business-logic/entities/label.entity";
import type { SeededMilestone } from "@gitea-automation/business-logic/entities/milestone.entity";
import type { GiteaWorld } from "./world";

// Typed reads of the scenario's state. Each throws a message naming what the scenario never set
// up, instead of letting a bare undefined fail somewhere later.
export function organizationName(world: GiteaWorld): string {
  const organization = world.scenarioState.organization;

  if (!organization) throw new Error("the scenario was not seeded with an organization");

  return organization.name;
}

export function projectId(world: GiteaWorld): number {
  const project = world.scenarioState.project;

  if (!project) throw new Error("the scenario has not created a project yet");

  return project.id;
}

export function seededRepositories(world: GiteaWorld): SeededRepository[] {
  const repositories = world.scenarioState.repositories ?? [];

  if (repositories.length === 0) throw new Error("the scenario was not seeded with repositories");

  return repositories;
}

export function firstSeededRepository(world: GiteaWorld): SeededRepository {
  return seededRepositories(world)[0];
}

export function secondSeededRepository(world: GiteaWorld): SeededRepository {
  const [, repository] = seededRepositories(world);

  if (!repository) throw new Error("the scenario was seeded with a single repository");

  return repository;
}

export function seededMilestone(world: GiteaWorld): SeededMilestone {
  const milestone = world.scenarioState.milestone;

  if (!milestone) throw new Error("the scenario was not seeded with a milestone");

  return milestone;
}

export function createdLabel(world: GiteaWorld): SeededLabel {
  const label = world.scenarioState.label;

  if (!label) throw new Error("the scenario has not created a label yet");

  return label;
}

export function createdIssue(world: GiteaWorld): { number?: number; title: string } {
  const issue = world.scenarioState.createdIssue;

  if (!issue) throw new Error("the scenario has not created an issue yet");

  return issue;
}

export function createdIssueNumber(world: GiteaWorld): number {
  const { number } = createdIssue(world);

  if (number === undefined) throw new Error("the created issue has not been submitted yet");

  return number;
}
