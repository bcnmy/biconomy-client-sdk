import { WalletClient } from "viem";
import { Signer } from "@ethersproject/abstract-signer";
import { SupportedSigner } from "../Types";
import { EthersSigner } from "../EthersSigner";
import { UNIQUE_PROPERTIES_PER_SIGNER } from "../Constants";
import { SmartAccountSigner } from "../../aa-core/signer/types";
import { WalletClientSigner } from "../../aa-core/signer/wallet-client";

interface SmartAccountResult {
  signer: SmartAccountSigner;
  chainId: number | undefined;
}

export const convertSigner = async (signer: SupportedSigner, skipChainIdCalls: boolean = false): Promise<SmartAccountResult> => {
  let resolvedSmartAccountSigner: SmartAccountSigner;
  let chainId: number | undefined;
  const isAnAlchemySigner = UNIQUE_PROPERTIES_PER_SIGNER.alchemy in signer;
  const isAnEthersSigner = UNIQUE_PROPERTIES_PER_SIGNER.ethers in signer;
  const isAViemSigner = UNIQUE_PROPERTIES_PER_SIGNER.viem in signer;

  if (!isAnAlchemySigner) {
    if (isAnEthersSigner) {
      const ethersSigner = signer as Signer;
      if (!skipChainIdCalls) {
        // If chainId not provided, get it from walletClient
        if (!ethersSigner.provider) {
          throw new Error("Cannot consume an ethers Wallet without a provider");
        }
        const chainIdFromProvider = await ethersSigner.provider.getNetwork();
        if (!chainIdFromProvider?.chainId) {
          throw new Error("Cannot consume an ethers Wallet without a chainId");
        }
        chainId = Number(chainIdFromProvider.chainId);
      }
      // convert ethers Wallet to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new EthersSigner(ethersSigner, "ethers");
    } else if (isAViemSigner) {
      const walletClient = signer as WalletClient;
      if (!walletClient.account) {
        throw new Error("Cannot consume a viem wallet without an account");
      }
      if (!skipChainIdCalls) {
        // If chainId not provided, get it from walletClient
        if (!walletClient.chain) {
          throw new Error("Cannot consume a viem wallet without a chainId");
        }
        chainId = walletClient.chain.id;
      }
      // convert viems walletClient to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new WalletClientSigner(walletClient, "viem");
    } else {
      throw new Error("Unsupported signer");
    }
  } else {
    resolvedSmartAccountSigner = signer as SmartAccountSigner;
  }
  return { signer: resolvedSmartAccountSigner, chainId };
};
