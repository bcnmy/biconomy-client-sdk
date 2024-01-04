import config from "./jest.config";
const e2eConfig = { ...config };
e2eConfig.testMatch = ["**/*.e2e.spec.ts"];
e2eConfig.setupFilesAfterEnv = ["<rootDir>/setup-e2e-tests.ts"];

export default e2eConfig;
