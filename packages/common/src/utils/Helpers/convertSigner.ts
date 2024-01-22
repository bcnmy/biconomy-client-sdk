import { EthersSigner } from "../EthersSigner";
import { SupportedSigner } from "../Types";
import { WalletClient } from "viem";
import { WalletClientSigner, SmartAccountSigner } from "@alchemy/aa-core";
import { UNIQUE_PROPERTIES_PER_SIGNER } from "../Constants";
import { Signer } from "@ethersproject/abstract-signer";

interface SmartAccountResult {
  signer: SmartAccountSigner;
  rpcUrl: string | undefined;
}

export const convertSigner = async (signer: SupportedSigner): Promise<SmartAccountResult> => {
  let resolvedSmartAccountSigner: SmartAccountSigner;
  let rpcUrl: string | undefined;
  const isAnAlchemySigner = UNIQUE_PROPERTIES_PER_SIGNER.alchemy in signer;
  const isAnEthersSigner = UNIQUE_PROPERTIES_PER_SIGNER.ethers in signer;
  const isAViemSigner = UNIQUE_PROPERTIES_PER_SIGNER.viem in signer;

  if (!isAnAlchemySigner) {
    if (isAnEthersSigner) {
      const ethersSigner = signer as Signer;
      // convert ethers Wallet to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new EthersSigner(ethersSigner, "ethers");
      // @ts-ignore
      rpcUrl = ethersSigner.provider?.connection?.url;
    } else if (isAViemSigner) {
      const walletClient = signer as WalletClient;
      if (!walletClient.account) {
        throw new Error("Cannot consume a viem wallet without an account");
      }
      // convert viems walletClient to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new WalletClientSigner(walletClient, "viem");
      rpcUrl = walletClient?.transport?.url;
    } else {
      throw new Error("Unsupported signer");
    }
  } else {
    resolvedSmartAccountSigner = signer as SmartAccountSigner;
  }
  return { signer: resolvedSmartAccountSigner, rpcUrl };
};
