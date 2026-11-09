import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist', '.cache', 'coverage', 'test-results', 'playwright-report', 'storybook-static'] },

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  {
    rules: {
      // A leading underscore marks a value that is unused on purpose (e.g. dropping a key with rest destructuring).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
    rules: {
      // These React Compiler rules flag patterns the app uses on purpose: the "latest value in a ref" pattern
      // (refs, immutability) and resyncing a local draft when the store changes (set-state-in-effect). The app
      // does not use React Compiler; revisit these if it is adopted.
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Plain JS files (this config) are not in a tsconfig, so they get no type-aware rules.
  { files: ['**/*.{js,mjs,cjs}'], extends: [tseslint.configs.disableTypeChecked] },

  // Last, so formatting is left to Prettier.
  prettier,
)
