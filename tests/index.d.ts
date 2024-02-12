import { Chain, Hex, PrivateKeyAccount, PublicClient, WalletClient } from "viem";
import { WalletClientSigner } from "@alchemy/aa-core";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";

interface WalletProps {
  alchemyWalletClientSigner: WalletClientSigner;
  viemWallet: WalletClient;
  balance: BigInt;
  publicAddress: Hex;
  account: PrivateKeyAccount;
  privateKey: Hex;
  ethersSigner: Signer;
}

export type TestData = {
  whale: WalletProps;
  minnow: WalletProps;
  publicClient: PublicClient;
  chainId: number;
  bundlerUrl: string;
  entryPointAddress: string;
  viemChain: Chain;
  biconomyPaymasterApiKey: string;
  ethersProvider: JsonRpcProvider;
};
