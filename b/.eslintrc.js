module.exports = {
    env: { browser: true, es2022: true },
    ignorePatterns: ['/*', '!/src', '!/backend'],
    plugins: [
        "@typescript-eslint",
        // "react", 
    ],
    overrides: [],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
    },
    extends: [
        "eslint:recommended",
        // "plugin:react/recommended",
        // "plugin:react/jsx-runtime",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        // "linebreak-style": ["warn", "unix"], // enforced by git
        "quotes": ["warn", "double"],
        "semi": ["warn", "always"],
        "max-nested-callbacks": ["warn", 2],
        "max-len": ["warn", 80, {
            "ignorePattern": "^import\\s.+\\sfrom\\s.+;$",
            "ignoreUrls": true,
        }],
        "comma-dangle": ["warn", "always-multiline"],
        "no-warning-comments": ["warn"],
        "no-console": ["warn", { allow: ["warn", "error"] }],
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "warn", // or "error"
            {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }
        ],
    },
};
