import { TestData } from ".";

describe("Bundler Tests", () => {
  let chain: TestData;

  beforeEach(() => {
    // @ts-ignore
    chain = testDataPerChain[0];
  });

  it("should have chain data", () => {
    expect(chain).toHaveProperty("chainId");
  });
});
