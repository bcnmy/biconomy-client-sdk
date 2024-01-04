import { Chain, Hex, PrivateKeyAccount, PublicClient, WalletClient } from "viem";
import { WalletClientSigner } from "@alchemy/aa-core";

interface WalletProps {
  signer: WalletClientSigner;
  walletClient: WalletClient;
  balance: BigInt;
  publicAddress: Hex;
  account: PrivateKeyAccount;
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
};
