import { TestData } from "../../../tests";
import { createSmartWalletClient } from "@biconomy-devx/account";
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
    } = ganache;

    const defaultValidationModule = await createMultiChainValidationModule({ signer });
    // Should not require a signer or chainId
    const smartWallet = await createSmartWalletClient({ bundlerUrl, defaultValidationModule });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
    // expect the relevant module to be set
    expect(smartWallet.activeValidationModule).toEqual(defaultValidationModule);
  });

  it("should create a ECDSAOwnershipValidationModule from a viem signer using convertSigner", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
    } = ganache;

    const defaultValidationModule = await createECDSAOwnershipValidationModule({ signer });
    // Should not require a signer or chainId
    const smartWallet = await createSmartWalletClient({
      bundlerUrl,
      defaultValidationModule,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
    // expect the relevant module to be set
    expect(smartWallet.activeValidationModule).toEqual(defaultValidationModule);
  });
});
