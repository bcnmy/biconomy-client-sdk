import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey, mnemonicToAccount } from "viem/accounts";
import { localhost } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";
import { ethers } from "ethers";

const TEST_CHAIN = {
  chainId: 1337,
  entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
  bundlerUrl: "https://bundler.biconomy.io/api/v2/1/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
  viemChain: localhost,
};

const MNEMONIC = "direct buyer cliff train rice spirit census refuse glare expire innocent quote";

beforeAll(() => {
  const chain = TEST_CHAIN;
  const { chainId, bundlerUrl, viemChain, entryPointAddress } = chain;
  const accountOne = mnemonicToAccount(MNEMONIC);

  const { privateKey } = ethers.Wallet.fromPhrase(MNEMONIC);

  const ethersProvider = new ethers.JsonRpcProvider(chain.viemChain.rpcUrls.public.http[0]);
  const ethersSignerOne = new ethers.Wallet(privateKey, ethersProvider);

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

  const ethersSignerTwo = new ethers.Wallet(privateKeyTwo, ethersProvider);
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
    ethersSigner: ethersSignerOne,
  };

  const minnow = {
    viemWallet: viemWalletClientTwo,
    alchemyWalletClientSigner: walletClientSignerTwo,
    balance: 0,
    publicAddress: publicAddressTwo,
    ethersSigner: ethersSignerTwo,
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
