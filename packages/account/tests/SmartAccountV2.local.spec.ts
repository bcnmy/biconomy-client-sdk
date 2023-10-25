import { EntryPoint, EntryPoint__factory, UserOperationStruct, SimpleAccountFactory__factory } from "@account-abstraction/contracts";
import { VoidSigner, Wallet, ethers } from "ethers";
import { SampleRecipient, SampleRecipient__factory } from "@account-abstraction/utils/dist/src/types";

import {
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory,
  ECDSAOwnershipRegistryModule_v100__factory,
  MultiChainValidationModule_v100__factory,
} from "@biconomy-devx/common";

import { BiconomySmartAccountV2 } from "../src/BiconomySmartAccountV2";
import { ChainId, UserOperation } from "@biconomy-devx/core-types";
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSAOwnershipValidationModule } from "@biconomy-devx/modules";
import { MultiChainValidationModule } from "@biconomy-devx/modules";
import { BaseValidationModule } from "@biconomy-devx/modules";
import { ECDSAOwnershipRegistryModule_v100 } from "@biconomy-devx/common";
import { MultiChainValidationModule_v100 } from "@biconomy-devx/common";

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = provider.getSigner();
const SENTINEL_MODULE = "0x0000000000000000000000000000000000000001";

describe("BiconomySmartAccountV2 API Specs", () => {
  let owner: Wallet;
  let factoryOwner: Wallet;
  let accountAPI: BiconomySmartAccountV2;
  let entryPoint: EntryPoint;
  let beneficiary: string;
  let recipient: SampleRecipient;
  let accountFactory: SmartAccountFactory_v200;
  let ecdsaModule: ECDSAOwnershipRegistryModule_v100;
  let multiChainModule: MultiChainValidationModule_v100;
  let accountAddress: string;

  let module1: BaseValidationModule;
  let module2: BaseValidationModule;

  beforeAll(async () => {
    owner = Wallet.createRandom();
    entryPoint = await new EntryPoint__factory(signer).deploy();
    console.log("ep address ", entryPoint.address);
    beneficiary = await signer.getAddress();
    factoryOwner = Wallet.createRandom();

    const accountImpl: SmartAccount_v200 = await new SmartAccount_v200__factory(signer).deploy(entryPoint.address);

    accountFactory = await new SmartAccountFactory_v200__factory(signer).deploy(accountImpl.address, await factoryOwner.getAddress());

    ecdsaModule = await new ECDSAOwnershipRegistryModule_v100__factory(signer).deploy();

    module1 = await ECDSAOwnershipValidationModule.create({
      signer: owner,
      moduleAddress: ecdsaModule.address,
    });

    multiChainModule = await new MultiChainValidationModule_v100__factory(signer).deploy();

    module2 = await MultiChainValidationModule.create({
      signer: owner,
      moduleAddress: multiChainModule.address,
    });

    console.log("provider url ", provider.connection.url);

    recipient = await new SampleRecipient__factory(signer).deploy();
    accountAPI = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      // paymaster: paymaster,
      // bundler: bundler,
      entryPointAddress: entryPoint.address,
      factoryAddress: accountFactory.address,
      implementationAddress: accountImpl.address,
      defaultFallbackHandler: await accountFactory.minimalHandler(),
      defaultValidationModule: module1,
      activeValidationModule: module1,
    });

    // console.log('account api provider ', accountAPI.provider)

    const counterFactualAddress = await accountAPI.getAccountAddress();
    console.log("Counterfactual address ", counterFactualAddress);

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }, 30000);

  it("Nonce should be zero", async () => {
    const builtUserOp = await accountAPI.buildUserOp([{ to: recipient.address, value: ethers.utils.parseEther("1".toString()), data: "0x" }]);
    console.log("builtUserOp", builtUserOp);
    expect(builtUserOp?.nonce?.toString()).toBe("0");
  });
  it("Sender should be non zero", async () => {
    const builtUserOp = await accountAPI.buildUserOp([{ to: recipient.address, value: ethers.utils.parseEther("1".toString()), data: "0x" }]);
    expect(builtUserOp.sender).not.toBe(ethers.constants.AddressZero);
  });
  it("InitCode length should be greater then 170", async () => {
    const builtUserOp = await accountAPI.buildUserOp([{ to: recipient.address, value: ethers.utils.parseEther("1".toString()), data: "0x" }]);
    expect(builtUserOp?.initCode?.length).toBeGreaterThan(170);
  });
  it("#getUserOpHash should match entryPoint.getUserOpHash", async function () {
    const userOp: UserOperation = {
      sender: "0x".padEnd(42, "1"),
      nonce: 2,
      initCode: "0x3333",
      callData: "0x4444",
      callGasLimit: 5,
      verificationGasLimit: 6,
      preVerificationGas: 7,
      maxFeePerGas: 8,
      maxPriorityFeePerGas: 9,
      paymasterAndData: "0xaaaaaa",
      signature: "0xbbbb",
    };
    const hash = await accountAPI.getUserOpHash(userOp);
    const epHash = await entryPoint.getUserOpHash(userOp);
    expect(hash).toBe(epHash);
  });
  it("should deploy to counterfactual address", async () => {
    accountAddress = await accountAPI.getAccountAddress();
    expect(await provider.getCode(accountAddress).then((code) => code.length)).toBe(2);

    await signer.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther("0.1"),
    });
    const op = await accountAPI.buildUserOp([
      {
        to: recipient.address,
        data: recipient.interface.encodeFunctionData("something", ["hello"]),
      },
    ]);

    const signedUserOp = await accountAPI.signUserOp(op);

    await entryPoint.handleOps([signedUserOp], beneficiary);

    // ((await expect(entryPoint.handleOps([signedUserOp], beneficiary))) as any).to.emit(recipient, "Sender");

    expect(await provider.getCode(accountAddress).then((code) => code.length)).toBeGreaterThan(0);
  }, 10000); // on github runner it takes more time than 5000ms

  // TODO
  // possibly use local bundler API from image
  it("should build and send userop via bundler API", async () => {});

  it("should deploy another account using different validation module", async () => {
    let accountAPI2 = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      // paymaster: paymaster,
      // bundler: bundler,
      entryPointAddress: entryPoint.address,
      factoryAddress: accountFactory.address,
      implementationAddress: accountAPI.getImplementationAddress(),
      defaultFallbackHandler: await accountFactory.minimalHandler(),
      defaultValidationModule: module2,
      activeValidationModule: module2,
    });

    // TODO
    // Review: Just setting different default validation module and querying account address is not working
    // accountAPI.setDefaultValidationModule(module2);

    accountAPI2 = await accountAPI2.init();

    const accountAddress2 = await accountAPI2.getAccountAddress();
    expect(await provider.getCode(accountAddress2).then((code) => code.length)).toBe(2);

    await signer.sendTransaction({
      to: accountAddress2,
      value: ethers.utils.parseEther("0.1"),
    });
    const op = await accountAPI2.buildUserOp([
      {
        to: recipient.address,
        data: recipient.interface.encodeFunctionData("something", ["hello"]),
      },
    ]);

    const signedUserOp = await accountAPI2.signUserOp(op);

    await entryPoint.handleOps([signedUserOp], beneficiary);

    // ((await expect(entryPoint.handleOps([signedUserOp], beneficiary))) as any).to.emit(recipient, "Sender");

    expect(await provider.getCode(accountAddress2).then((code) => code.length)).toBeGreaterThan(0);
  });

  it("should check if module is enabled", async () => {
    const isEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module1 as any).moduleAddress);

    expect(isEcdsaModuleEnabled).toBe(true);

    const isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);

    expect(isMultichainEcdsaModuleEnabled).toBe(false);
  });

  it("should list all enabled modules", async () => {
    const paginatedModules = await accountAPI.getAllModules();
    console.log("enabled modules ", paginatedModules);
  });

  it("should enable a new module", async () => {
    let isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);
    expect(isMultichainEcdsaModuleEnabled).toBe(false);

    // Review: this actually skips whole paymaster stuff and also sends to connected bundler
    // const userOpResponse = await accountAPI.enableModule((module2 as any).moduleAddress);

    const enableModuleData = await accountAPI.getEnableModuleData((module2 as any).moduleAddress);

    await signer.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther("0.1"),
    });

    const op = await accountAPI.buildUserOp([enableModuleData], {
      // skipBundlerGasEstimation: true,
      // overrides: { verificationGasLimit: 120000, callGasLimit: 100000, preVerificationGas: 60000 },
    });

    const signedUserOp = await accountAPI.signUserOp(op);

    await entryPoint.handleOps([signedUserOp], beneficiary);

    // ((await expect(entryPoint.handleOps([signedUserOp], beneficiary))) as any).to.emit(recipient, "Sender");

    isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);

    expect(isMultichainEcdsaModuleEnabled).toBe(true);
  });

  it("signs the userOp using active validation module", async () => {
    const op = await accountAPI.buildUserOp([
      {
        to: recipient.address,
        data: recipient.interface.encodeFunctionData("something", ["hello"]),
      },
    ]);

    const signedUserOp = await accountAPI.signUserOp(op);

    expect(signedUserOp.signature).toBeDefined();

    const userOpHash = await accountAPI.getUserOpHash(op);

    const signature = await accountAPI.signUserOpHash(userOpHash);

    console.log("signature ", signature);

    expect(signature).toBeDefined();
  });

  it("disables requested module", async () => {
    let isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);
    expect(isMultichainEcdsaModuleEnabled).toBe(true);

    const disableModuleData = await accountAPI.getDisableModuleData(SENTINEL_MODULE, (module2 as any).moduleAddress);

    await signer.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther("0.1"),
    });

    const op = await accountAPI.buildUserOp([disableModuleData], {
      // skipBundlerGasEstimation: true,
      // overrides: { verificationGasLimit: 120000, callGasLimit: 100000, preVerificationGas: 60000 },
    });

    const signedUserOp = await accountAPI.signUserOp(op);

    await entryPoint.handleOps([signedUserOp], beneficiary);

    // ((await expect(entryPoint.handleOps([signedUserOp], beneficiary))) as any).to.emit(recipient, "Sender");

    isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);
    expect(isMultichainEcdsaModuleEnabled).toBe(false);

    const modulesAfter = await accountAPI.getAllModules();
    expect(modulesAfter[0]).toBe((module1 as any).moduleAddress);
  });

  it("sends userop using multichain (different) validation module after enabling and setting it up", async () => {
    let isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);
    expect(isMultichainEcdsaModuleEnabled).toBe(false);

    // Review: this actually skips whole paymaster stuff and also sends to connected bundler
    // const userOpResponse = await accountAPI.enableModule((module2 as any).moduleAddress);

    const accountOwnerAddress = await owner.getAddress();

    const multichainEcdsaOwnershipSetupData = multiChainModule.interface.encodeFunctionData("initForSmartAccount", [accountOwnerAddress]);

    const setupAndEnableModuleData = await accountAPI.getSetupAndEnableModuleData((module2 as any).moduleAddress, multichainEcdsaOwnershipSetupData);

    await signer.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther("0.1"),
    });

    const op1 = await accountAPI.buildUserOp([setupAndEnableModuleData], {
      // skipBundlerGasEstimation: true,
      // overrides: { verificationGasLimit: 120000, callGasLimit: 100000, preVerificationGas: 60000 },
    });

    console.log("op1 ", op1);

    const signedUserOp1 = await accountAPI.signUserOp(op1);

    await entryPoint.handleOps([signedUserOp1], beneficiary);

    isMultichainEcdsaModuleEnabled = await accountAPI.isModuleEnabled((module2 as any).moduleAddress);
    expect(isMultichainEcdsaModuleEnabled).toBe(true);

    // Setting it as active validation module now
    accountAPI = accountAPI.setActiveValidationModule(module2);

    const op = await accountAPI.buildUserOp([
      {
        to: recipient.address,
        data: recipient.interface.encodeFunctionData("something", ["hello"]),
      },
    ]);

    const signedUserOp = await accountAPI.signUserOp(op);

    await entryPoint.handleOps([signedUserOp], beneficiary);

    // ((await expect(entryPoint.handleOps([signedUserOp], beneficiary))) as any).to.emit(recipient, "Sender");
  }, 10000); // on github runner it takes more time than 5000ms

  it("Creates another replicated instance using void signer", async () => {
    const newmodule = await ECDSAOwnershipValidationModule.create({
      signer: new VoidSigner(await owner.getAddress()),
      moduleAddress: ecdsaModule.address,
    });

    const accountAPI2 = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      // paymaster: paymaster,
      // bundler: bundler,
      entryPointAddress: entryPoint.address,
      factoryAddress: accountFactory.address,
      implementationAddress: accountAPI.getImplementationAddress(),
      defaultFallbackHandler: await accountFactory.minimalHandler(),
      defaultValidationModule: newmodule,
      activeValidationModule: newmodule,
    });

    const address = await accountAPI2.getAccountAddress();
    console.log("account address ", address);

    expect(address).toBe(accountAPI.accountAddress);
  }, 10000);

  // TODO
  // 1. sendSignedUserOp()
  // 2. sendUserOp()
  // 3. sending userOps using a paymaster
});
