import { PaymasterMode } from "@biconomy-devx/paymaster";
import { TestData } from "../../../tests";
import { createSmartAccountClient } from "../../account/src/index";
import { Hex, encodeFunctionData, parseAbi } from "viem";
import { DEFAULT_MULTICHAIN_MODULE, createECDSAOwnershipValidationModule } from "@biconomy-devx/modules";

describe("Account with ECDSAOwnershipValidationModule Module Tests", () => {
  let mumbai: TestData;
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseSepolia] = testDataPerChain;
  });

  it("should create a ECDSAOwnershipValidationModule with signer", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
    } = mumbai;

    const defaultValidationModule = await createECDSAOwnershipValidationModule({ signer });
    // Should not require a signer or chainId
    const smartAccount = await createSmartAccountClient({
      bundlerUrl,
      defaultValidationModule,
      signer,
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
    expect(smartAccount.activeValidationModule).toEqual(defaultValidationModule);
  });

  it("should create a ECDSAOwnershipValidationModule without signer", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
    } = mumbai;

    const defaultValidationModule = await createECDSAOwnershipValidationModule({ signer });
    // Should not require a signer or chainId
    const smartAccount = await createSmartAccountClient({
      bundlerUrl,
      defaultValidationModule,
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
    expect(smartAccount.activeValidationModule).toEqual(defaultValidationModule);
  });

  it("should create a ECDSAOwnershipValidationModule by default, without explicitly setting it on the smart account", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
    } = mumbai;
    const defaultValidationModule = await createECDSAOwnershipValidationModule({ signer });
    const smartAccount = await createSmartAccountClient({ bundlerUrl, signer });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
    const smartAccountValidationModuleAddress = await smartAccount.activeValidationModule.getAddress();
    expect(smartAccountValidationModuleAddress).toEqual(defaultValidationModule.moduleAddress);
  });
});
