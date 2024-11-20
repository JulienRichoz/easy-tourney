export default [
  {
    ignores: ['node_modules', 'public', 'uploads', '.env'], // Remplace l'ancien .eslintignore
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
    },
  },
];
