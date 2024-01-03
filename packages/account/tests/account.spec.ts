import { PaymasterMode } from "@biconomy/paymaster";
import { TestData } from ".";
import { createSmartWalletClient } from "../src/index";
import { Bundler } from "@biconomy/bundler";
import { Hex, encodeFunctionData } from "viem";

describe("Account Tests", () => {
  let chain: TestData;

  beforeEach(() => {
    // @ts-ignore
    chain = testDataPerChain[0];
  });

  it("should provide an account address", async () => {
    const {
      chainId,
      whale: { signer },
      bundlerUrl,
    } = chain;
    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundlerUrl,
    });

    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should send some native token to a recipient", async () => {
    const {
      chainId,
      whale: { signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      entryPointAddress,
    } = chain;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const { wait } = await smartWallet.sendTransaction({
      to: recipient,
      value: 1,
      data: "0x",
    });

    const result = await wait();

    expect(result?.receipt?.transactionHash).toBeTruthy();
  }, 30000);

  it("Should gaslessly mint an NFT", async () => {
    const {
      chainId,
      whale: { signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      entryPointAddress,
      biconomyPaymasterApiKey,
    } = chain;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      biconomyPaymasterApiKey,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const address = await smartWallet.getAccountAddress();

    const encodedCall = encodeFunctionData({
      abi: [
        {
          inputs: [{ name: "address", type: "address" }],
          name: "safeMint",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "safeMint",
      args: [address as Hex],
    });

    const transaction = {
      to: "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e", // NFT address
      data: encodedCall,
      value: 0,
    };
    const { wait } = await smartWallet.sendTransaction(
      {
        to: recipient,
        value: 1,
        data: "0x",
      },
      {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED,
        },
      },
    );

    const result = await wait();

    expect(result?.receipt?.transactionHash).toBeTruthy();
  }, 30000);

  it("should have an active validation module", async () => {
    const {
      chainId,
      whale: { signer },
      bundlerUrl,
    } = chain;
    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundlerUrl,
    });

    const module = smartWallet.activeValidationModule;
    expect(module).toBeTruthy();
  });

  it("Create a smart account with paymaster through api key", async () => {
    const {
      chainId,
      whale: { signer, walletClient },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = chain;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const address = await smartWallet.getAccountAddress();
    const paymaster = smartWallet.paymaster;
    expect(paymaster).not.toBeNull();
    expect(paymaster).not.toBeUndefined();
  });

  it("Sender should be non zero", async () => {
    const {
      chainId,
      whale: { signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      entryPointAddress,
    } = chain;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const builtUserOp = await smartWallet.buildUserOp([{ to: recipient, value: 1000, data: "0x" }]);
    expect(builtUserOp.sender).not.toBe("0x0000000000000000000000000000000000000000");
  }, 30000);

  it("InitCode length should be equal to 0x", async () => {
    const {
      chainId,
      whale: { signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      entryPointAddress,
    } = chain;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const builtUserOp = await smartWallet.buildUserOp([{ to: recipient, value: 1000, data: "0x" }]);
    expect(builtUserOp.sender).not.toBe("0x0000000000000000000000000000000000000000");
    expect(builtUserOp?.initCode?.length).toBe(2);
  });
});
