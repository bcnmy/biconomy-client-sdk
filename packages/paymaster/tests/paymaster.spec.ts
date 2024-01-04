import { TestData } from ".";

describe("Paymaster Unit Tests", () => {
  let chainData: TestData;

  beforeEach(() => {
    // @ts-ignore
    chainData = testDataPerChain[0];
  });

  it("should have chain data", () => {
    expect(chainData).toHaveProperty("chainId");
  });
});
