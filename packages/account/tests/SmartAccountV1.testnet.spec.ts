import { Wallet, ethers } from "ethers";
import { SampleRecipient, SampleRecipient__factory } from "@account-abstraction/utils/dist/src/types";
import { BiconomySmartAccount } from "../src/BiconomySmartAccount";
import { ChainId, UserOperation } from "@biconomy-devx/core-types";
import { calcPreVerificationGas } from "../src/utils/Preverificaiton";

describe("calcPreVerificationGas", () => {
  const userOp = {
    sender: "0x".padEnd(42, "1"),
    nonce: 0,
    initCode: "0x3333",
    callData: "0x4444",
    callGasLimit: 5,
    verificationGasLimit: 6,
    maxFeePerGas: 8,
    maxPriorityFeePerGas: 9,
    paymasterAndData: "0xaaaaaa",
  };
  it("returns a gas value proportional to sigSize", async () => {
    const pvg1 = calcPreVerificationGas(userOp, { sigSize: 0 });
    const pvg2 = calcPreVerificationGas(userOp, { sigSize: 65 });
    expect(pvg2.toNumber()).toBeGreaterThan(pvg1.toNumber());
  });
});

describe("BiconomySmartAccount API Specs", () => {
  let owner: Wallet;
  let target: string;
  let accountAPI: BiconomySmartAccount;
  let beneficiary: string;
  let recipient: SampleRecipient;
  let accountAddress: string;

  beforeAll(async () => {
    owner = Wallet.createRandom();

    target = await Wallet.createRandom().getAddress();

    // recipient = await new SampleRecipient__factory(owner).deploy();
    accountAPI = new BiconomySmartAccount({
      chainId: ChainId.POLYGON_MUMBAI,
      signer: owner,
      // paymaster: paymaster,
      // bundler: bundler,
    });

    // console.log('account api provider ', accountAPI.provider)

    accountAPI = await accountAPI.init();
    console.log("Account EOA owner ", accountAPI.owner);

    const counterFactualAddress = await accountAPI.getSmartAccountAddress(0);
    console.log("Counterfactual address ", counterFactualAddress);
  }, 20000);

  // on Mumbai testnet some tests should be performed to make sure nothing breaks in AccountV1

  /*it("Nonce should be zero", async () => {
    const builtUserOp = await accountAPI.buildUserOp([{ to: target, value: ethers.utils.parseEther("1".toString()), data: "0x" }]);
    console.log("builtUserOp", builtUserOp);
    expect(builtUserOp?.nonce?.toString()).toBe("0");
  });
  it("Sender should be non zero", async () => {
    const builtUserOp = await accountAPI.buildUserOp([{ to: target, value: ethers.utils.parseEther("1".toString()), data: "0x" }]);
    expect(builtUserOp.sender).not.toBe(ethers.constants.AddressZero);
  });
  it("InitCode length should be greater then 170", async () => {
    const builtUserOp = await accountAPI.buildUserOp([{ to: target, value: ethers.utils.parseEther("1".toString()), data: "0x" }]);
    expect(builtUserOp?.initCode?.length).toBeGreaterThan(170);
  });*/
  it("estimateUserOperationGas for native token transfer using local estimation logic", async () => {});
});
