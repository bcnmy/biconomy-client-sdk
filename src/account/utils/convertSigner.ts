import {
  http,
  type Hex,
  type PrivateKeyAccount,
  type WalletClient,
  createWalletClient
} from "viem"
import { WalletClientSigner } from "../../account"
import type { LightSigner, Signer, SmartAccountSigner, SupportedSigner } from "../../account"
import { EthersSigner } from "./EthersSigner.js"

interface SmartAccountResult {
  signer: SmartAccountSigner
  chainId: number | null
  rpcUrl: string | undefined
}

function isPrivateKeyAccount(
  signer: SupportedSigner
): signer is PrivateKeyAccount {
  return (signer as PrivateKeyAccount).type === "local"
}

export function isWalletClient(
  signer: SupportedSigner
): signer is WalletClient {
  return (signer as WalletClient).transport !== undefined
}

function isEthersSigner(signer: SupportedSigner): signer is Signer {
  return (signer as Signer).provider !== undefined
}

function isAlchemySigner(
  signer: SupportedSigner
): signer is SmartAccountSigner {
  return (signer as SmartAccountSigner)?.signerType !== undefined
}

export const convertSigner = async (
  signer: SupportedSigner,
  skipChainIdCalls = false,
  _rpcUrl?: string
): Promise<SmartAccountResult> => {
  let resolvedSmartAccountSigner: SmartAccountSigner
  let rpcUrl: string | undefined = _rpcUrl
  let chainId: number | null = null

  if (!isAlchemySigner(signer)) {
    if (isEthersSigner(signer)) {
      const ethersSigner = signer as Signer
      if (!skipChainIdCalls) {
        // If chainId not provided, get it from walletClient
        if (!ethersSigner.provider) {
          throw new Error("Cannot consume an ethers Wallet without a provider")
        }
        const chainIdFromProvider = await ethersSigner.provider.getNetwork()
        if (!chainIdFromProvider?.chainId) {
          throw new Error("Cannot consume an ethers Wallet without a chainId")
        }
        chainId = Number(chainIdFromProvider.chainId)
      }
      // convert ethers Wallet to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new EthersSigner(ethersSigner, "ethers")
      // @ts-ignore
      rpcUrl = ethersSigner.provider?.connection?.url ?? undefined
    } else if (isWalletClient(signer)) {
      const walletClient = signer as WalletClient
      if (!walletClient.account) {
        throw new Error("Cannot consume a viem wallet without an account")
      }
      if (!skipChainIdCalls) {
        // If chainId not provided, get it from walletClient
        if (!walletClient.chain) {
          throw new Error("Cannot consume a viem wallet without a chainId")
        }
        chainId = walletClient.chain.id
      }
      // convert viems walletClient to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new WalletClientSigner(walletClient, "viem")
      rpcUrl = walletClient?.transport?.url ?? undefined
    } else if (isPrivateKeyAccount(signer)) {
      if (rpcUrl !== null && rpcUrl !== undefined) {
        const walletClient = createWalletClient({
          account: signer as PrivateKeyAccount,
          transport: http(rpcUrl)
        })
        resolvedSmartAccountSigner = new WalletClientSigner(
          walletClient,
          "viem"
        )
      } else {
        throw new Error(
          "rpcUrl is required for PrivateKeyAccount signer type, please provide it in the config"
        )
      }
    } else {
      throw new Error("Unsupported signer")
    }
  } else {
    resolvedSmartAccountSigner = signer as SmartAccountSigner
  }
  return { signer: resolvedSmartAccountSigner, rpcUrl, chainId }
}
/*
  This function is used to get the signer's address, it can be used to get the signer's address from different types of signers.
  The function takes a signer as an argument and returns the signer's address.
  The function checks the type of the signer and returns the signer's address based on the type of the signer.
  The function throws an error if the signer is not supported.
*/
export const getSignerAddress = async (signer: SupportedSigner): Promise<Hex> => {
  if (isEthersSigner(signer)) {
    const result = await (signer as Signer).getAddress();
    if (result) return result as Hex
    throw new Error("Unsupported signer");
  } if (isWalletClient(signer)) {
    const result = ((signer as WalletClient)?.account?.address);
    if (result) return result as Hex
    throw new Error("Unsupported signer");
  } if (isPrivateKeyAccount(signer)) {
    const result = ((signer as PrivateKeyAccount)?.address);
    if (result) return result as Hex
    throw new Error("Unsupported signer");
  } if (isAlchemySigner(signer)) {
    const result = ((signer as SmartAccountSigner)?.inner?.address);
    if (result) return result as Hex
    throw new Error("Unsupported signer");
  }
  throw new Error("Unsupported signer");
}