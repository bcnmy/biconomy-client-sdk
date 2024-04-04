import { TestData } from "../../../tests";

describe("Paymaster Unit Tests", () => {
  let optimism: TestData;
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [optimism, baseSepolia] = testDataPerChain;
  });

  it("should have chain data for optimism", () => {
    expect(optimism).toHaveProperty("chainId");
  });

  it("should also have chain data for base", () => {
    expect(baseSepolia).toHaveProperty("chainId");
  });
});
