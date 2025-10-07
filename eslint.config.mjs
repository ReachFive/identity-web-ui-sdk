// @ts-check

import eslint from "@eslint/js";
import compat from "eslint-plugin-compat";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.eslintRecommended,
    ...tseslint.configs.stylisticTypeChecked,
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    prettier,
    // reactHooks.configs.recommended,
    compat.configs["flat/recommended"],
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
        languageOptions: {
            ...react.configs.flat?.recommended.languageOptions,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            },
            globals: {
                ...globals.browser
            }
        },
        plugins: {
            "react-hooks": reactHooks.configs.recommended
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
        },
        settings: {
            polyfills: ["Promise", "fetch", "URLSearchParams"],
            react: {
                version: "detect"
            }
        }
    }
);
