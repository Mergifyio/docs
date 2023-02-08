module.exports = {
  globals: {
    __PATH_PREFIX__: true,
  },
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    },
    'import/ignore': ['.esm.js']
  },
  extends: ['react-app', 'plugin:mdx/recommended', 'eslint:recommended', 'plugin:import/recommended'],
  overrides: [
    {
      files: ['*.mdx'],
      globals: {
        Button: 'readonly',
        ExpansionPanel: 'readonly',
        MultiCodeBlock: 'readonly',
      },
      rules: {
        'no-unused-vars': 'off'
      }
    }
  ]
};
