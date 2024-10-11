import { EntryPoint, EntryPoint__factory } from "@account-abstraction/contracts";
import { Wallet, ethers } from "ethers";
import { SampleRecipient, SampleRecipient__factory } from "@account-abstraction/utils/dist/src/types";

import {
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory,
  ECDSAOwnershipRegistryModule_v100__factory,
} from "@biconomy/common";

import { BiconomySmartAccountV2 } from "../src/BiconomySmartAccountV2";
import { ChainId } from "@biconomy/core-types";
import { ECDSAOwnershipRegistryModule_v100 } from "@biconomy/common";
import { ECDSAOwnershipValidationModule } from "@biconomy/modules";

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = provider.getSigner();

describe("BiconomySmartAccountV2 Module Abstraction", () => {
  let owner: Wallet;
  let factoryOwner: Wallet;
  let entryPoint: EntryPoint;
  let beneficiary: string;
  let recipient: SampleRecipient;
  let accountFactory: SmartAccountFactory_v200;
  let ecdsaModule: ECDSAOwnershipRegistryModule_v100;

  beforeAll(async () => {
    owner = Wallet.createRandom();
    entryPoint = await new EntryPoint__factory(signer).deploy();
    console.log("ep address ", entryPoint.address);
    beneficiary = await signer.getAddress();
    factoryOwner = Wallet.createRandom();

    const accountImpl: SmartAccount_v200 = await new SmartAccount_v200__factory(signer).deploy(entryPoint.address);

    accountFactory = await new SmartAccountFactory_v200__factory(signer).deploy(accountImpl.address, await factoryOwner.getAddress());

    ecdsaModule = await new ECDSAOwnershipRegistryModule_v100__factory(signer).deploy();

    recipient = await new SampleRecipient__factory(signer).deploy();

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }, 30000);

  it("Create smart account with default module (ECDSA)", async () => {
    const account: BiconomySmartAccountV2 = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      entryPointAddress: entryPoint.address,
      signer,
      bundlerUrl: "https://bundler.biconomy.io/api/v2/1337/...",
      /*defaultValidationModule: await ECDSAOwnershipValidationModule.create({
        signer: signer,
        moduleAddress: ecdsaModule.address,
      }),*/
    });

    const address = await account.getAccountAddress();
    console.log("Module Abstraction Test - Account address ", address);

    expect(address).toBe(account.accountAddress);

    const module = account.activeValidationModule;
    console.log(`ACTIVE MODULE - ${module.getAddress()}`);
  }, 10000);

  it("Create smart account with ECDSA module", async () => {
    const account: BiconomySmartAccountV2 = await BiconomySmartAccountV2.create({
      chainId: ChainId.GANACHE,
      rpcUrl: "http://127.0.0.1:8545",
      entryPointAddress: entryPoint.address,
      signer,
      bundlerUrl: "https://bundler.biconomy.io/api/v2/1337/...",
    });

    const address = await account.getAccountAddress();
    console.log("Module Abstraction Test - Account address ", address);

    expect(address).toBe(account.accountAddress);

    const module = account.activeValidationModule;
    console.log(`ACTIVE MODULE - ${module.getAddress()}`);
  }, 10000);
});
