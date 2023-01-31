module.exports = {
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    },
    'import/ignore': ['.esm.js']
  },
  parserOptions: {
    "requireConfigFile": false,
    "babelOptions": {
      "presets": ["@babel/preset-react"]
    }
  },
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
      },
      rules: {
        'no-unused-vars': 'off'
      }
    }
  ]
};
