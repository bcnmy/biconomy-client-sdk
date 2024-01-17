import { Chain, Hex, PrivateKeyAccount, PublicClient, WalletClient } from "viem";
import { WalletClientSigner } from "@alchemy/aa-core";
import { JsonRpcProvider, JsonRpcSigner as Signer } from "@ethersproject/providers";

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
