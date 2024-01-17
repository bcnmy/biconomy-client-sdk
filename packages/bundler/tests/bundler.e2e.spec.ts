import { TestData } from "../../../tests";

describe("Bundler Unit Tests", () => {
  let mumbai: TestData;
  let baseGoerli: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseGoerli] = testDataPerChain;
  });

  it("should have chain data for mumbai", () => {
    expect(mumbai).toHaveProperty("chainId");
  });

  it("should also have chain data for base", () => {
    expect(baseGoerli).toHaveProperty("chainId");
  });
});
