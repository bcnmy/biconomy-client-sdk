import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonMumbai } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";
import { config } from "dotenv";

config();

const TEST_CHAINS = [
  {
    chainId: 80001,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/80001/-2BFRwRlJ.8afbc010-edcf-46b3-8713-77639655f2dd",
    viemChain: polygonMumbai,
    biconomyPaymasterApiKey: process.env.BICO_PAYMASTER_KEY_MUMBAI!,
  },
];

beforeAll(async () => {
  envVarCheck();

  const walletOne = privateKeyToAccount(`0x${process.env.PRIVATE_KEY_ONE}`);
  const walletTwo = privateKeyToAccount(`0x${process.env.PRIVATE_KEY_TWO}`);

  const promises = TEST_CHAINS.map((chain) => {
    const publicClient = createPublicClient({
      chain: chain.viemChain,
      transport: http(),
    });
    const walletOneClient = createWalletClient({
      account: walletOne,
      chain: chain.viemChain,
      transport: http(chain.viemChain.rpcUrls.public.http[0]),
    });
    const walletTwoClient = createWalletClient({
      account: walletTwo,
      chain: chain.viemChain,
      transport: http(chain.viemChain.rpcUrls.public.http[0]),
    });
    const signerOne = new WalletClientSigner(walletOneClient, "json-rpc");
    const signerTwo = new WalletClientSigner(walletTwoClient, "json-rpc");

    return Promise.all([
      Promise.all([
        {
          ...chain,
          publicClient,
          publicAddress: walletOne.address,
          signer: signerOne,
          walletClient: walletOneClient,
        },
        publicClient.getBalance({
          address: walletOne.address,
        }),
      ]),
      Promise.all([
        {
          ...chain,
          publicClient,
          publicAddress: walletTwo.address,
          signer: signerTwo,
          walletClient: walletTwoClient,
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
    const datum = {
      publicClient: whaleBalance.publicClient,
      chainId: whaleBalance.chainId,
      bundlerUrl: whaleBalance.bundlerUrl,
      entryPointAddress: whaleBalance.entryPointAddress,
      viemChain: whaleBalance.viemChain,
      biconomyPaymasterApiKey: whaleBalance.biconomyPaymasterApiKey,
      whale: {
        balance: whaleBalance.balance,
        signer: whaleBalance.signer,
        walletClient: whaleBalance.walletClient,
        publicAddress: whaleBalance.publicAddress,
      },
      minnow: {
        balance: minnowBalance.balance,
        signer: minnowBalance.signer,
        walletClient: minnowBalance.walletClient,
        publicAddress: minnowBalance.publicAddress,
      },
    };
    return datum;
  });
});

const envVarCheck = () => {
  const REQUIRED_FIELDS = ["PRIVATE_KEY_ONE", "PRIVATE_KEY_TWO", "BICO_PAYMASTER_KEY_MUMBAI"];
  const hasFields = REQUIRED_FIELDS.every((field) => !!process.env[field]);
  if (!hasFields) {
    console.error("Missing env var");
    process.exit(0);
  }
};
