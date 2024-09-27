
// Generated from .eslintrc with:
// npx @eslint/migrate-config .eslintrc.json
// See https://eslint.org/docs/latest/use/configure/migration-guide

import jest from "eslint-plugin-jest";
import react from "eslint-plugin-react";
import reactRedux from "eslint-plugin-react-redux";
import globals from "globals";
import babelParser from "babel-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/build/", "**/node_modules/"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:react/recommended",
    "plugin:react-redux/recommended",
), {
    plugins: {
        jest,
        react,
        "react-redux": reactRedux,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            Atomics: "readonly",
            SharedArrayBuffer: "readonly",
        },

        parser: babelParser,
        ecmaVersion: 2018,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        "no-extra-boolean-cast": "off",
        "no-empty": "off",
        "no-case-declarations": "off",

        "no-unused-vars": ["error", {
            varsIgnorePattern: "_.+",
            argsIgnorePattern: "_.*|reject",
        }],

        "react/no-unescaped-entities": "off",
        "react/display-name": "off",
        "react/prop-types": "off",
        "react-redux/prefer-separate-component-file": "off",
        "jest/no-disabled-tests": "off",
    },
}];
