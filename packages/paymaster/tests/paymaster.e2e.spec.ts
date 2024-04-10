import { TestData } from "../../../tests";

describe("Paymaster Unit Tests", () => {
  let amoy: TestData;
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [amoy, baseSepolia] = testDataPerChain;
  });

  it("should have chain data for amoy", () => {
    expect(amoy).toHaveProperty("chainId");
  });

  it("should also have chain data for base", () => {
    expect(baseSepolia).toHaveProperty("chainId");
  });
});
