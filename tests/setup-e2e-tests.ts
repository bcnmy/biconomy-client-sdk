import { createWalletClient, http, createPublicClient } from "viem";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { privateKeyToAccount } from "viem/accounts";
import { WalletClientSigner } from "@biconomy-devx/common";
import { config } from "dotenv";
import { E2E_TEST_CHAINS } from "./chains.config";

config();

beforeAll(async () => {
  envVarCheck();

  const privateKeyOne: `0x${string}` = `0x${process.env.E2E_PRIVATE_KEY_ONE}`;
  const privateKeyTwo: `0x${string}` = `0x${process.env.E2E_PRIVATE_KEY_TWO}`;
  const walletOne = privateKeyToAccount(privateKeyOne);
  const walletTwo = privateKeyToAccount(privateKeyTwo);

  const promises = E2E_TEST_CHAINS.map((chain) => {
    const ethersProvider = new JsonRpcProvider(chain.viemChain.rpcUrls.default.http[0]);
    const ethersSignerOne = new Wallet(privateKeyOne, ethersProvider);
    const ethersSignerTwo = new Wallet(privateKeyTwo, ethersProvider);

    const publicClient = createPublicClient({
      chain: chain.viemChain,
      transport: http(),
    });

    const viemWalletClientOne = createWalletClient({
      account: walletOne,
      chain: chain.viemChain,
      transport: http(chain.viemChain.rpcUrls.default.http[0]),
    });
    const viemWalletClientTwo = createWalletClient({
      account: walletTwo,
      chain: chain.viemChain,
      transport: http(chain.viemChain.rpcUrls.default.http[0]),
    });
    const walletClientSignerOne = new WalletClientSigner(viemWalletClientOne, "viem");
    const walletClientSignerTwo = new WalletClientSigner(viemWalletClientTwo, "viem");

    return Promise.all([
      Promise.all([
        {
          ...chain,
          publicClient,
          account: walletOne,
          publicAddress: walletOne.address,
          viemWallet: viemWalletClientOne,
          alchemyWalletClientSigner: walletClientSignerOne,
          ethersProvider,
          ethersSigner: ethersSignerOne,
          privateKey: privateKeyOne,
        },
        publicClient.getBalance({
          address: walletOne.address,
        }),
      ]),
      Promise.all([
        {
          ...chain,
          publicClient,
          account: walletTwo,
          publicAddress: walletTwo.address,
          viemWallet: viemWalletClientTwo,
          alchemyWalletClientSigner: walletClientSignerTwo,
          ethersProvider,
          ethersSigner: ethersSignerTwo,
          privateKey: privateKeyTwo,
        },
        publicClient.getBalance({
          address: walletTwo.address,
        }),
      ]),
    ]);
  });
  const balancesPerChain = await Promise.all(promises);

  // @ts-ignore
  testDataPerChain = balancesPerChain.map((dataAndBalanceArray) => {
    const sortedBalances = dataAndBalanceArray
      .map(([datum, balance]) => ({
        ...datum,
        balance,
      }))
      .sort((a, b) => {
        if (a.balance > b.balance) {
          return 1;
        } else if (a.balance > b.balance) {
          return -1;
        } else {
          return 0;
        }
      });

    const whaleBalance = sortedBalances[0];
    const minnowBalance = sortedBalances[1];

    const commonData = {
      publicClient: whaleBalance.publicClient,
      chainId: whaleBalance.chainId,
      bundlerUrl: whaleBalance.bundlerUrl,
      entryPointAddress: whaleBalance.entryPointAddress,
      viemChain: whaleBalance.viemChain,
      biconomyPaymasterApiKey: whaleBalance.biconomyPaymasterApiKey,
      ethersProvider: whaleBalance.ethersProvider,
      paymasterUrl: whaleBalance.paymasterUrl,
    };

    const datum = {
      ...commonData,
      whale: {
        balance: whaleBalance.balance,
        viemWallet: whaleBalance.viemWallet,
        alchemyWalletClientSigner: whaleBalance.alchemyWalletClientSigner,
        publicAddress: whaleBalance.publicAddress,
        account: whaleBalance.account,
        ethersSigner: whaleBalance.ethersSigner,
        privateKey: whaleBalance.privateKey,
      },
      minnow: {
        balance: minnowBalance.balance,
        viemWallet: minnowBalance.viemWallet,
        alchemyWalletClientSigner: minnowBalance.alchemyWalletClientSigner,
        publicAddress: minnowBalance.publicAddress,
        account: minnowBalance.account,
        ethersSigner: whaleBalance.ethersSigner,
        privateKey: minnowBalance.privateKey,
      },
    };
    return datum;
  });
});

const envVarCheck = () => {
  const REQUIRED_FIELDS = ["E2E_PRIVATE_KEY_ONE", "E2E_PRIVATE_KEY_TWO", "E2E_BICO_PAYMASTER_KEY_MUMBAI", "E2E_BICO_PAYMASTER_KEY_BASE"];
  const hasFields = REQUIRED_FIELDS.every((field) => !!process.env[field]);
  if (!hasFields) {
    console.error("Missing env var");
    process.exit(0);
  }
};
