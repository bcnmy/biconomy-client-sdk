module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "airbnb-typescript/base", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: './tsconfig.eslint.json',
  },
  env: {
    node: true,
    es6: true,
  },
  plugins: ["@typescript-eslint", "prettier", "security", "import"],
  rules: {
    "prettier/prettier": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "security/detect-object-injection": "warn",
    "security/detect-unsafe-regex": "error",
  },
  settings: {},
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
      },
    },
  ],
};
