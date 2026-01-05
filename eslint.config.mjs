import eslint from "@eslint/js";
import compat from "eslint-plugin-compat";
import importPlugin from "eslint-plugin-import";
import jestDom from "eslint-plugin-jest-dom";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import testingLibrary from "eslint-plugin-testing-library";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: ["**/*.svg"]
    },
    eslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    prettier,
    // reactHooks.configs.flat.recommended,
    compat.configs["flat/recommended"],
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
        languageOptions: {
            ...react.configs.flat.recommended.languageOptions,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            },
            globals: {
                ...globals.browser
            }
        },
        settings: {
            polyfills: ["Promise", "fetch", "URLSearchParams"],
            react: {
                version: "detect"
            },
            "import/resolver": {
                typescript: true
            }
        },
        rules: {
            "no-unused-vars": "off",
            "react/jsx-uses-vars": "error",
            "react/jsx-uses-react": "error",
            "react/prop-types": "off",
            "@typescript-eslint/ban-types": "off",
            "@typescript-eslint/consistent-type-definitions": "off",
            "@typescript-eslint/no-confusing-void-expression": [
                "error",
                {
                    ignoreArrowShorthand: true
                }
            ],
            "@typescript-eslint/no-empty-function": [
                "error",
                {
                    allow: ["arrowFunctions"]
                }
            ],
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-misused-promises": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    varsIgnorePattern: "^_"
                }
            ]
        }
    },
    {
        files: ["tests/**/*.{ts,tsx}"],
        ...jestDom.configs["flat/recommended"],
        ...testingLibrary.configs["flat/react"]
    }
);
