import { TestData } from "../../../tests";

describe("Bundler Unit Tests", () => {
  let ganache: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("should have chain data for ganache", () => {
    expect(ganache).toHaveProperty("chainId");
  });
});
