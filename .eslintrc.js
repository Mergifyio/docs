module.exports = {
  globals: {
    __PATH_PREFIX__: true,
  },
  parserOptions: {
    "project": ["tsconfig.json"],
  },
  overrides: [
    {
      files: ['*.mdx'],
      extends: 'plugin:mdx/recommended',
      rules: {
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'airbnb',
        'airbnb-typescript',
        'react-app', 
        'eslint:recommended', 
        'plugin:import/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
      ],
      rules: {
        "react/no-danger": "error",
        "import/order": [
          "error",
          {
            "newlines-between": "always-and-inside-groups",
            "alphabetize": {
              "order": "asc"
            }
          }
        ],
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/no-static-element-interactions": "off",
        "jsx-a11y/no-autofocus": "off",
        "jsx-a11y/label-has-associated-control": "off",
        "react/jsx-one-expression-per-line": "off",
        "react/jsx-props-no-spreading": "off",
        "react/jsx-filename-extension": "off",
        "react/require-default-props": "off",
        "react/forbid-prop-types": "off",
        "@typescript-eslint/require-default-props": "off",
        "@typescript-eslint/naming-convention": "off",
        "import/prefer-default-export": "off",
        "no-underscore-dangle": "off",
        "no-plusplus": ["error", {allowForLoopAfterthoughts: true}]
      },
    }
  ]
};
