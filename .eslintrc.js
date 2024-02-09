module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "airbnb-typescript/base", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.eslint.json",
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
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // needs to be set to "error" later
    "no-console": "warn",
    "@typescript-eslint/naming-convention": "off", // needs to be removed later
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "security/detect-object-injection": "warn",
    "security/detect-unsafe-regex": "error",
    "import/extensions": "error", // Now we need to specify extensions for imports for esm builds
    "security/detect-object-injection": "off", // turning off Injection Sink rule
    "@typescript-eslint/no-throw-literal": "off", // temp deactivated needs to be removed once fixed
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/ban-ts-comment": "off",
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
