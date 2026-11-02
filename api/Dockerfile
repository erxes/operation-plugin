# Stage 1: install production deps as flat real directories (no pnpm virtual store)
FROM node:22-alpine3.22 AS installer
WORKDIR /app
# arm64 images are built under QEMU, where V8's JIT intermittently crashes
# (SIGILL) during pnpm install. Interpreter-only Node is slower but stable;
# it only affects this stage, not the runtime image.
ENV NODE_OPTIONS=--jitless
RUN npm install -g pnpm@9

COPY api/package.json ./
# Its own RUN: a failed install must fail the build, not be hidden by the
# cleanup's `|| true` below.
RUN pnpm install --prod --no-lockfile --shamefully-hoist --ignore-scripts
RUN find node_modules -type f \( \
         -name "*.d.ts" -o -name "*.map" -o -name "*.md" \
         -o -name "LICENSE*" -o -name "LICENCE*" \
         -o -name "CHANGELOG*" -o -name "README*" \
         -o -name "CONTRIBUTING*" -o -name "AUTHORS*" \
         -o -name ".npmignore" -o -name ".eslintrc*" -o -name "Makefile" \
       \) -delete \
    && find node_modules -mindepth 2 -maxdepth 3 -type d \( \
         -name "test" -o -name "tests" -o -name "__tests__" -o -name "spec" \
         -o -name "docs" -o -name "doc" -o -name "examples" -o -name "example" \
         -o -name ".github" -o -name "coverage" \
       \) -prune -exec rm -rf {} \; 2>/dev/null || true

# Stage 2: minimal runtime
FROM node:22-alpine3.22
WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
# Plugin compiled dist (built by CI before docker build)
COPY api/dist ./dist

ENV NODE_ENV=production
USER 1000
CMD ["node", "dist/src/main.js"]
