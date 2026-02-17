import { fixupPluginRules } from '@eslint/compat';
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astroParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';
import * as mdxPlugin from 'eslint-plugin-mdx';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default [
  // Base configuration for all files
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      '.github/**',
      'public/scalar-api-reference.js',
      'src/content/changelog/',
    ],
  },

  // JavaScript/TypeScript base config
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...eslint.configs.recommended.rules,
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // TypeScript declaration files
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // TSX/React files
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: fixupPluginRules(reactPlugin),
    },
    settings: {
      react: {
        pragma: 'h',
        version: '19.0',
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Astro files
  ...astroPlugin.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsparser,
        extraFileExtensions: ['.astro'],
      },
    },
  },

  // Script tags in Astro files
  {
    files: ['**/*.astro/*.js', '*.astro/*.js'],
    languageOptions: {
      parser: tsparser,
    },
  },

  // MDX files
  {
    files: ['**/*.mdx'],
    ...mdxPlugin.flat,
    plugins: {
      mdx: fixupPluginRules(mdxPlugin),
    },
    rules: {
      'mdx/remark': 'error',
    },
  },
];
