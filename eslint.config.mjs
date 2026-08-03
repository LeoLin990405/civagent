// Backend ESLint (engine + server + tests, all ESM .mjs running on Node).
// The frontend has its own config under frontend/. Run via `npm run lint:backend`.
import js from '@eslint/js';
import globals from 'globals';

export default [
  // .ccb/ is the CCB agent runtime: git worktrees, provider caches and vendored
  // agent code checked out inside the repo. It is gitignored, but ESLint does
  // not read .gitignore, so without this it lints thousands of third-party
  // files and reports their errors as this project's.
  { ignores: ['frontend/**', 'node_modules/**', 'dist/**', '.ccb/**'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Unused vars are errors, but allow intentional _-prefixed args/vars
      // (e.g. Express error-handler arity, ignored mock params).
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
