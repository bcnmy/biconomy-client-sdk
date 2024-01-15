import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey, mnemonicToAccount } from "viem/accounts";
import { WalletClientSigner } from "@alchemy/aa-core";
import { UNIT_TEST_CHAIN } from "./chains.config";

const MNEMONIC = "direct buyer cliff train rice spirit census refuse glare expire innocent quote";

beforeAll(() => {
  const { chainId, bundlerUrl, viemChain, entryPointAddress } = UNIT_TEST_CHAIN;
  const accountOne = mnemonicToAccount(MNEMONIC);
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

  const accountTwo = privateKeyToAccount(generatePrivateKey());
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
  };

  const minnow = {
    viemWallet: viemWalletClientTwo,
    alchemyWalletClientSigner: walletClientSignerTwo,
    balance: 0,
    publicAddress: publicAddressTwo,
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
