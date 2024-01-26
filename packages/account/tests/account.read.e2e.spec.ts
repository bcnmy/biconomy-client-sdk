import { TestData } from "../../../tests";
import { createSmartAccountClient } from "../src/index";
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, createECDSAOwnershipValidationModule } from "@biconomy/modules";

describe("Account Tests", () => {
  let mumbai: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai] = testDataPerChain;
  });

  it("should check if module is enabled on the smart account", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const isEnabled = await smartWallet.isModuleEnabled(DEFAULT_ECDSA_OWNERSHIP_MODULE);
    expect(isEnabled).toBeTruthy();
  });

  it("should get all modules", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const modules = await smartWallet.getAllModules();
    expect(modules).toContain("0x000000D50C68705bd6897B2d17c7de32FB519fDA"); // erc20 module
    expect(modules).toContain("0x000002FbFfedd9B33F4E7156F2DE8D48945E7489"); // session manager module
    expect(modules).toContain("0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e"); // ecdsa ownership module
  });

  it("should disabled module data", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const disableModuleData = await smartWallet.getDisableModuleData(DEFAULT_ECDSA_OWNERSHIP_MODULE, DEFAULT_ECDSA_OWNERSHIP_MODULE);
    expect(disableModuleData).toBeTruthy();
  });

  it("should get setup and enable module data", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const module = await createECDSAOwnershipValidationModule({ signer });
    const initData = await module.getInitData();
    const setupAndEnableModuleData = await smartWallet.getSetupAndEnableModuleData(DEFAULT_ECDSA_OWNERSHIP_MODULE, initData);
    expect(setupAndEnableModuleData).toBeTruthy();
  });

  it("should read estimated user op gas values", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const tx = {
      to: "0x000000D50C68705bd6897B2d17c7de32FB519fDA",
      data: "0x",
    };

    const userOp = await smartWallet.buildUserOp([tx]);

    const estimatedGas = await smartWallet.estimateUserOpGas(userOp);
    expect(estimatedGas.maxFeePerGas).toBeTruthy();
    expect(estimatedGas.maxPriorityFeePerGas).toBeTruthy();
    expect(estimatedGas.verificationGasLimit).toBeTruthy();
    expect(estimatedGas.callGasLimit).toBeTruthy();
    expect(estimatedGas.preVerificationGas).toBeTruthy();
    expect(estimatedGas).toHaveProperty("paymasterAndData", "0x");
  });
});
