import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    rules: {
      curly: 'warn',
      eqeqeq: 'warn',
      'no-throw-literal': 'warn',
      semi: ['error', 'never'],
      'comma-dangle': ['error', 'always-multiline'],
      'quotes': ['error', 'single'],
      'require-await': 'off',
    },
  },
  {
    files: ['**/*.{ts,cts,mts}'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },

    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          'checksVoidReturn': false,
        },
      ],
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['**/*.{js,cts,mjs}', '**/*.test.ts'],  // 本当は '.test.ts' にも tslint を適用したいが、tsconfig.json で exclude しているのと競合する.
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.{js,cts,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es6,
      },
    },
  },
)
