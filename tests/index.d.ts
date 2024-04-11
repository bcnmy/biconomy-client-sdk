import { Chain, Hex, PrivateKeyAccount, PublicClient, WalletClient } from "viem";
import { WalletClientSigner } from "@biconomy/common";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";

interface WalletProps {
  alchemyWalletClientSigner: WalletClientSigner;
  viemWallet: WalletClient;
  balance: bigint;
  publicAddress: Hex;
  account: PrivateKeyAccount;
  privateKey: Hex;
  ethersSigner: Signer;
}

export type TestData = {
  nftAddress: Hex;
  deploymentCost: number;
  whale: WalletProps;
  minnow: WalletProps;
  publicClient: PublicClient;
  chainId: number;
  bundlerUrl: string;
  entryPointAddress: string;
  viemChain: Chain;
  paymasterUrl: string;
  biconomyPaymasterApiKey: string;
  ethersProvider: JsonRpcProvider;
};
