import { TestData } from "../../../tests";

describe("Paymaster Unit Tests", () => {
  let mumbai: TestData;
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseSepolia] = testDataPerChain;
  });

  it("should have chain data for mumbai", () => {
    expect(mumbai).toHaveProperty("chainId");
  });

  it("should also have chain data for base", () => {
    expect(baseSepolia).toHaveProperty("chainId");
  });
});
