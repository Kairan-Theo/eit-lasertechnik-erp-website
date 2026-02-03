export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
        localStorage: "readonly",
        confirm: "readonly",
        alert: "readonly",
        document: "readonly",
        window: "readonly"
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  }
  ,
  {
    files: ["vite.config.ts", "vite.config.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-undef": "off"
    }
  }
]
