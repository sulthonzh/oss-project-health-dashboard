import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // CLI tool using commander — options are inherently untyped
      'no-console': 'off',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', 'src/**/*.test.ts', 'src/types.test.ts'],
  },
);
