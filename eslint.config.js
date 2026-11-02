const tseslint = require('typescript-eslint');

// A pattern part is safe only when it is a literal or a direct escapeRegExp()
// call. Inside a composed TemplateLiteral or BinaryExpression, every operand
// (template expression / binary left+right) must satisfy the same rule;
// deeper nesting is covered because the operand matcher applies at every level.
const UNSAFE_OPERAND =
  ":matches(BinaryExpression > :matches(*.left, *.right), TemplateLiteral > *.expressions):not(Literal):not(CallExpression[callee.name='escapeRegExp']):not(BinaryExpression):not(TemplateLiteral)";

const SAFE_TEMPLATE = `TemplateLiteral:not(:has(> *.expressions:not(Literal):not(CallExpression[callee.name='escapeRegExp'])))`;

const SAFE_BINARY = `BinaryExpression:not(:has(${UNSAFE_OPERAND}))`;

const NOT_SAFE_PATTERN = `:not(Literal):not(CallExpression[callee.name='escapeRegExp']):not(${SAFE_TEMPLATE}):not(${SAFE_BINARY})`;

module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'ui/src/gql/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['api/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `NewExpression[callee.name='RegExp']:has(> *.arguments${NOT_SAFE_PATTERN})`,
          message:
            'Wrap user input in escapeRegExp from erxes-api-shared/utils before building a RegExp.',
        },
        {
          selector: `:matches(Property[key.name='$regex'], Property[key.value='$regex']) > *.value${NOT_SAFE_PATTERN}`,
          message:
            'Wrap user input in escapeRegExp from erxes-api-shared/utils before using it in $regex.',
        },
      ],
    },
  },
  {
    files: ['ui/**/*.ts', 'ui/**/*.tsx', 'ui/**/*.js', 'ui/**/*.jsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'graphql-tag',
              message:
                "Use `import { gql } from '~/gql'` so codegen picks the document up.",
            },
            {
              name: '@apollo/client',
              importNames: ['gql'],
              message:
                "Use `import { gql } from '~/gql'` so codegen picks the document up.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[typeArguments]:matches([callee.name=/^use(Query|Mutation|Subscription|LazyQuery|SuspenseQuery)$/], [callee.property.name=/^use(Query|Mutation|Subscription|LazyQuery|SuspenseQuery)$/])',
          message:
            'Do not pass type arguments to Apollo hooks; infer them from a document created with gql() from ~/gql.',
        },
        {
          selector:
            "CallExpression[typeArguments]:matches([callee.name='subscribeToMore'], [callee.property.name='subscribeToMore'])",
          message:
            'Do not pass type arguments to subscribeToMore; infer them from a document created with gql() from ~/gql.',
        },
      ],
    },
  },
];
