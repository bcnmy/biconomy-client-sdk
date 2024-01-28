import { createWalletClient, http, createPublicClient } from "viem";
import { WalletClientSigner } from "@biconomy-devx/common";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { UNIT_TEST_CHAIN } from "./chains.config";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

beforeAll(() => {
  const { chainId, bundlerUrl, viemChain, entryPointAddress } = UNIT_TEST_CHAIN;
  const privateKeyOne = generatePrivateKey();
  const accountOne = privateKeyToAccount(privateKeyOne);

  const ethersProvider = new JsonRpcProvider(viemChain.rpcUrls.default.http[0]);
  const ethersSignerOne = new Wallet(privateKeyOne, ethersProvider);

  const viemWalletClientOne = createWalletClient({
    account: accountOne,
    chain: viemChain,
    transport: http(viemChain.rpcUrls.default.http[0]),
  });

  const walletClientSignerOne = new WalletClientSigner(viemWalletClientOne, "viem");
  const publicAddressOne = accountOne.address;
  const publicClient = createPublicClient({
    chain: viemChain,
    transport: http(),
  });

  const privateKeyTwo = generatePrivateKey();
  const accountTwo = privateKeyToAccount(privateKeyTwo);

  const ethersSignerTwo = new Wallet(privateKeyTwo, ethersProvider);

  const viemWalletClientTwo = createWalletClient({
    account: accountTwo,
    chain: viemChain,
    transport: http(viemChain.rpcUrls.default.http[0]),
  });
  const walletClientSignerTwo = new WalletClientSigner(viemWalletClientTwo, "viem");
  const publicAddressTwo = accountTwo.address;

  const whale = {
    viemWallet: viemWalletClientOne,
    alchemyWalletClientSigner: walletClientSignerOne,
    balance: 0,
    publicAddress: publicAddressOne,
    ethersSigner: ethersSignerOne,
    account: accountOne,
    privateKey: privateKeyOne,
  };

  const minnow = {
    viemWallet: viemWalletClientTwo,
    alchemyWalletClientSigner: walletClientSignerTwo,
    balance: 0,
    publicAddress: publicAddressTwo,
    ethersSigner: ethersSignerTwo,
    account: accountTwo,
    privateKey: privateKeyTwo,
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
      ethersProvider,
    },
  ];
});
