// Backend ESLint (engine + server + tests, all ESM .mjs running on Node).
// The frontend has its own config under frontend/. Run via `npm run lint:backend`.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['frontend/**', 'node_modules/**', 'dist/**'] },
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
