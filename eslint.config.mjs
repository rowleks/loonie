import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default defineConfig([
  // Next.js configs
  ...nextVitals,
  ...nextTs,

  // Global ignores
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist/**",
    "node_modules/**",
  ]),

  // TypeScript/TSX files configuration (primary config for this TS project)
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    extends: [
      js.configs.recommended,
      prettier,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: tsparser,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
        // Conditionally enable project-based type checking
        project: "./tsconfig.json",
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React rules
      "react-refresh/only-export-components": "off",
      "react/prop-types": "off",
      "react/require-default-props": "off",

      // TypeScript-specific rules (enabled)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "no-unused-vars": "off",

      // Shared rules / style
      "no-console": "warn",
      semi: ["error", "never"],
      eqeqeq: "error",
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      "arrow-spacing": ["error", { before: true, after: true }],
      "prefer-const": "error",
      "prefer-arrow-callback": "warn",
      "object-shorthand": ["warn", "always"],
      "prefer-template": "warn",
      "no-duplicate-imports": "error",
      "require-await": "warn",
      "prefer-destructuring": ["warn", { object: true, array: false }],

      // Import rules
      "import/order": [
        "off",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
        },
      ],
      "import/no-unused-modules": "warn",
      "import/no-duplicates": "error",
    },
  },

  // JS/JS files configuration (minimal fallback for plain JS files, if any)
  {
    files: ["**/*.js"],
    plugins: {
      import: importPlugin,
    },
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
      eqeqeq: "error",
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      "arrow-spacing": ["error", { before: true, after: true }],
      "no-console": "warn",
      semi: ["error", "never"],
      "prefer-const": "error",
      "prefer-arrow-callback": "warn",
      "object-shorthand": ["warn", "always"],
      "prefer-template": "warn",
      "no-duplicate-imports": "error",
      "require-await": "warn",
      "func-style": ["warn", "expression", { allowArrowFunctions: true }],
      "prefer-destructuring": ["warn", { object: true, array: false }],
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
        },
      ],
      "import/no-unused-modules": "warn",
      "import/no-duplicates": "error",
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    rules: {
      // Relax rules in test files
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off", // Recommended if using TS
    },
  },
])
