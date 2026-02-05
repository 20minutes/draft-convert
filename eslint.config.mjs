import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import twentyMinutesConfig from "@20minutes/eslint-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const baseConfig = Array.isArray(twentyMinutesConfig)
  ? twentyMinutesConfig
  : compat.extends("@20minutes");

export default [
  ...baseConfig,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-undefined": "off",
      "no-unused-vars": ["error", { vars: "all", args: "none" }],
      "no-param-reassign": "off",
      "consistent-return": "off",
      "no-underscore-dangle": "off",
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/control-has-associated-label": "off",
      "no-console": "off"
    }
  },
  {
    files: ["test/**/*.js"],
    rules: {
      "react/display-name": "off"
    }
  }
];
