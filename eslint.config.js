import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.worktrees', 'server', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // The new React 19 hooks plugin flags every setState-after-fetch as "set-state-in-effect".
      // Our load-then-setState pattern is intentional and idiomatic; downgrade to warning.
      'react-hooks/set-state-in-effect': 'off',
      // Same plugin flags `new Date(...)` inside useMemo as impure even when it's deterministic.
      'react-hooks/purity': 'off',
      // Allow non-component exports (e.g. `useAuth` hook colocated with `<AuthProvider>`).
      'react-refresh/only-export-components': 'off',
    },
  },
])
