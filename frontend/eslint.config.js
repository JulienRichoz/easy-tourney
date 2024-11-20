module.exports = [
    {
        ignores: ['node_modules', 'dist', 'public'],
    },
    {
        plugins: {
            vue: require('eslint-plugin-vue'),
            prettier: require('eslint-plugin-prettier'),
        },
        languageOptions: {
            parser: '@babel/eslint-parser',
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
            },
        },
        rules: {
            ...require('eslint-plugin-vue').configs['vue3-essential'].rules,
            'prettier/prettier': 'error',
        },
    },
];
