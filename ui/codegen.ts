import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Snapshot of the composed erxes gateway schema; refresh it with
  // `pnpm schema:update` (see README).
  schema: 'schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**'],
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false, gqlTagName: 'gql' },
      config: {
        scalars: {
          Date: { input: 'string | Date', output: 'string' },
          JSON: 'unknown',
        },
        enumsAsTypes: true,
        useTypeImports: true,
      },
    },
  },
};

export default config;
