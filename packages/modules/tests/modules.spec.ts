import { TestData } from "../../../tests";
import { createSmartAccountClient } from "@biconomy/account";
import { createECDSAOwnershipValidationModule, createMultiChainValidationModule } from "../src";

describe("Account Tests", () => {
  let ganache: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("should create a MultiChainValidationModule from an ethers signer using convertSigner", async () => {
    const {
      bundlerUrl,
      whale: { ethersSigner: signer },
      viemChain,
    } = ganache;

    const defaultValidationModule = await createMultiChainValidationModule({ signer });
    // Should not require a signer or chainId
    const smartAccount = await createSmartAccountClient({ bundlerUrl, defaultValidationModule, rpcUrl: viemChain.rpcUrls.default.http[0], });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
    // expect the relevant module to be set
    expect(smartAccount.activeValidationModule).toEqual(defaultValidationModule);
  });

  it("should create a ECDSAOwnershipValidationModule from a viem signer using convertSigner", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
      viemChain,
    } = ganache;

    const defaultValidationModule = await createECDSAOwnershipValidationModule({ signer });
    // Should not require a signer or chainId
    const smartAccount = await createSmartAccountClient({
      bundlerUrl,
      defaultValidationModule,
      rpcUrl: viemChain.rpcUrls.default.http[0],
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
    // expect the relevant module to be set
    expect(smartAccount.activeValidationModule).toEqual(defaultValidationModule);
  });
});
