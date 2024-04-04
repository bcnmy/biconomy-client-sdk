import { TestData } from "../../../tests";

describe("Paymaster Unit Tests", () => {
  let ganache: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("should have chain data for optimism", () => {
    expect(ganache).toHaveProperty("chainId");
  });
});
