import { EntryPoint, EntryPoint__factory } from "@account-abstraction/contracts";
import { Wallet, ethers } from "ethers";

import {
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory,
  ECDSAOwnershipRegistryModule_v100__factory,
} from "@biconomy/common";

import { BiconomySmartAccountV2 } from "../src/BiconomySmartAccountV2";
import { ChainId } from "@biconomy/core-types";
import { ECDSAOwnershipValidationModule } from "@biconomy/modules";
import { BaseValidationModule } from "@biconomy/modules";
import { ECDSAOwnershipRegistryModule_v100 } from "@biconomy/common";
import { BiconomyPaymaster } from "@biconomy/paymaster";

require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = provider.getSigner();

describe("BiconomySmartAccountV2 Paymaster Abstraction", () => {
  let owner: Wallet;
  let factoryOwner: Wallet;
  let account: BiconomySmartAccountV2;
  let entryPoint: EntryPoint;
  let accountFactory: SmartAccountFactory_v200;
  let ecdsaModule: ECDSAOwnershipRegistryModule_v100;

  let module1: BaseValidationModule;

  beforeAll(async () => {
    owner = Wallet.createRandom();
    entryPoint = await new EntryPoint__factory(signer).deploy();
    console.log("ep address ", entryPoint.address);
    factoryOwner = Wallet.createRandom();

    const accountImpl: SmartAccount_v200 = await new SmartAccount_v200__factory(signer).deploy(entryPoint.address);

    accountFactory = await new SmartAccountFactory_v200__factory(signer).deploy(accountImpl.address, await factoryOwner.getAddress());

    ecdsaModule = await new ECDSAOwnershipRegistryModule_v100__factory(signer).deploy();

    module1 = await ECDSAOwnershipValidationModule.create({
      signer: owner,
      moduleAddress: ecdsaModule.address,
    });

    console.log("provider url ", provider.connection.url);

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }, 30000);

  it("Create a smart account with paymaster through api key", async () => {

    account = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      entryPointAddress: entryPoint.address,
      biconomyPaymasterApiKey: process.env.API_KEY,
      factoryAddress: accountFactory.address,
      defaultFallbackHandler: await accountFactory.minimalHandler(),
      defaultValidationModule: module1,
      activeValidationModule: module1,
    });

    const address = await account.getAccountAddress();
    console.log("account address ", address);

    const paymaster = account.paymaster;

    expect(paymaster).not.toBeNull()
    expect(paymaster).not.toBeUndefined()

    expect(address).toBe(account.accountAddress);
  }, 10000);

  it("Create a smart account with paymaster by creating instance", async () => {

    const paymaster = new BiconomyPaymaster({
      paymasterUrl: process.env.PAYMASTER_URL || "",
    })

    account = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      entryPointAddress: entryPoint.address,
      factoryAddress: accountFactory.address,
      defaultFallbackHandler: await accountFactory.minimalHandler(),
      defaultValidationModule: module1,
      activeValidationModule: module1,
      paymaster: paymaster
    });

    const address = await account.getAccountAddress();
    console.log("account address ", address);

    expect(account.paymaster).not.toBeNull()
    expect(account.paymaster).not.toBeUndefined()

    expect(address).toBe(account.accountAddress);
  }, 10000);

});