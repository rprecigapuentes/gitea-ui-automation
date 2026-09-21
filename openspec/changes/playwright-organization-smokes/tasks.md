## 1. Create an organization and its teams

- [x] 1.1 Port "Create Organization" and "Create teams for an existing organization", with the existing-organization fixture
- [x] 1.2 Run both on chrome, firefox and edge. "Create Organization" exposed one more difference: `getText` returned raw text nodes, so it now returns the rendered, trimmed text

## 2. Add a user to a team and create a repository

- [ ] 2.1 Port "Add a user to a team" and "Create a repository for an existing organization"
- [ ] 2.2 Run both on chrome, firefox and edge

## 3. Add a repository to a team

- [ ] 3.1 Port "Add a repository to a team", with the `@team-repository` fixture
- [ ] 3.2 Run it on chrome, firefox and edge

## 4. Wrap up

- [ ] 4.1 Document the spec and the fixtures in the README
- [ ] 4.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
