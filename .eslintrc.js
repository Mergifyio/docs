module.exports = {
  extends: ['plugin:mdx/recommended', 'eslint:recommended', 'plugin:import/recommended'],
  globals: {
    "window": true,
    "document": true
  },
  overrides: [
    {
      files: ['*.mdx'],
      globals: {
        Button: 'readonly',
        ExpansionPanel: 'readonly',
        MultiCodeBlock: 'readonly',
        YouTube: 'readonly',
      },
      rules: {
        'react/no-unescaped-entities': 'off',
        'react/jsx-no-undef': 'off',
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['**/__tests__/*.js', '**.test.js'],
      env: {
        jest: true
      }
    }
  ]
};
