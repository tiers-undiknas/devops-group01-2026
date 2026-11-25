export default [
  {
    files: ["src/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly", document: "readonly", location: "readonly",
        confirm: "readonly", alert: "readonly", console: "readonly",
        fetch: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
        setInterval: "readonly", clearInterval: "readonly",
        URL: "readonly", URLSearchParams: "readonly", Event: "readonly",
        CustomEvent: "readonly", Response: "readonly", Request: "readonly",
        Headers: "readonly", global: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "eqeqeq": ["error", "always"]
    }
  }
];
