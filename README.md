# operation-plugin

erxes `operation` plugin, standalone repository (extracted from the erxes
monorepo with its git history). Two pnpm workspaces:

- `api/` — backend plugin (`operation_api`). Express + Apollo Federation subgraph;
  registers with the erxes gateway via Redis service discovery. Owns tasks and triage, teams, statuses, cycles, milestones, projects, notes, activity, templates and the GitHub issue integration.
- `ui/` — frontend Module Federation remote (`operation_ui`). Built with
  Nx + Rspack; loaded by `core-ui` through `/get-frontend-plugins`.
  Dev port 3006.

Shared platform libraries come from npm (`@erxes/api-shared`,
`@erxes/ui`, `@erxes/ui-modules`) — installed under the unscoped import
names via `npm:` aliases, so source imports like `erxes-api-shared/utils` and
`erxes-ui` keep working unchanged. Keep all three on the same range.

## Develop

Use pnpm 9 (the lockfile is v9; pnpm 10+ rejects the `xlsx` tarball
dependency of `@erxes/ui-modules`):

```sh
pnpm install
pnpm dev:api        # tsx watch api/src/main.ts
pnpm dev:ui         # nx serve operation_ui  (module-federation dev server)
```

## Build

```sh
pnpm build          # api tsc build + ui nx production build (dist/ui)
pnpm build:api
pnpm build:ui       # runs GraphQL codegen first
pnpm test
```

## GraphQL codegen

UI documents are typed with `@graphql-codegen` (`gql` from `~/gql`). The
generated `ui/src/gql/` is not committed; `nx build` / `nx serve` regenerate
it from `ui/schema.graphql`, a committed snapshot of the composed erxes
gateway schema (core plus every plugin, including this one).

Refresh the snapshot whenever this plugin's API schema or a used core type
changes. In an erxes checkout that has this plugin's API in place:

```sh
pnpm nx run gateway:schema:compose          # in erxes
ERXES_DIR=../erxes pnpm schema:update       # here; copies the composed schema
```

## CI / CD

`.github/workflows/ci.yml` runs only the side that changed (`api/**` → API
job, `ui/**` → UI job; root files and the workflow run both; a manual run
always runs both).

| Event | Deploy |
|-------|--------|
| `pull_request` | never (build only) |
| push to `main` | `erxes/erxes-next-operation_api:latest` + `:<yyyymmdd>-<shortsha>`, UI to `s3://erxes-next/latest/operation_ui/` |
| `workflow_dispatch` | build only |

The API image does not compile anything: `api/Dockerfile` installs production
dependencies and copies the `api/dist` the CI build step produced
(`.dockerignore` lets only `api/dist` through).

## Releases

Same contract as the erxes monorepo: a release freezes what is currently on
`latest` under a version. Release with the same version as erxes.

```sh
git tag 3.4.9 && git push origin 3.4.9
# or: Actions → Release → Run workflow → version 3.4.9
```

`.github/workflows/release.yml` tags `erxes/erxes-next-operation_api:latest` as
`:<version>` and copies `s3://erxes-next/latest/operation_ui/` to
`s3://erxes-next/<version>/operation_ui/`. Let CI on `main` finish first.

## Required secrets

- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` — Docker Hub push (api job, release)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — R2 sync (ui job, release)
