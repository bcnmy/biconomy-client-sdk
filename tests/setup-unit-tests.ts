import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey, mnemonicToAccount } from "viem/accounts";
import { WalletClientSigner } from "@alchemy/aa-core";
import { UNIT_TEST_CHAIN } from "./chains.config";

beforeAll(() => {
  const { chainId, bundlerUrl, viemChain, entryPointAddress } = UNIT_TEST_CHAIN;
  const privateKeyOne = generatePrivateKey();
  const accountOne = mnemonicToAccount(privateKeyOne);
  const viemWalletClientOne = createWalletClient({
    account: accountOne,
    chain: viemChain,
    transport: http(viemChain.rpcUrls.public.http[0]),
  });
  const walletClientSignerOne = new WalletClientSigner(viemWalletClientOne, "viem");
  const publicAddressOne = accountOne.address;
  const publicClient = createPublicClient({
    chain: viemChain,
    transport: http(),
  });

  const privateKeyTwo = generatePrivateKey();
  const accountTwo = privateKeyToAccount(privateKeyTwo);
  const viemWalletClientTwo = createWalletClient({
    account: accountTwo,
    chain: viemChain,
    transport: http(viemChain.rpcUrls.public.http[0]),
  });
  const walletClientSignerTwo = new WalletClientSigner(viemWalletClientTwo, "viem");
  const publicAddressTwo = accountTwo.address;

  const whale = {
    viemWallet: viemWalletClientOne,
    alchemyWalletClientSigner: walletClientSignerOne,
    balance: 0,
    publicAddress: publicAddressOne,
    account: accountOne,
    prvateKey: privateKeyOne,
  };

  const minnow = {
    viemWallet: viemWalletClientTwo,
    alchemyWalletClientSigner: walletClientSignerTwo,
    balance: 0,
    publicAddress: publicAddressTwo,
    account: accountTwo,
    prvateKey: privateKeyTwo,
  };

  // @ts-ignore
  testDataPerChain = [
    {
      whale,
      minnow,
      publicClient,
      chainId,
      bundlerUrl,
      entryPointAddress,
      viemChain,
    },
  ];
});
