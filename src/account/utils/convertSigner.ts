import {
  http,
  type PrivateKeyAccount,
  type WalletClient,
  createWalletClient
} from "viem"
import { WalletClientSigner } from "../../account"
import type { Signer, SmartAccountSigner, SupportedSigner } from "../../account"
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

function isWalletClient(signer: SupportedSigner): signer is WalletClient {
  return (signer as WalletClient).type === "walletClient"
}

function isEthersSigner(signer: SupportedSigner): signer is Signer {
  return (signer as Signer).provider !== undefined
}

function isAlchemySigner(
  signer: SupportedSigner
): signer is SmartAccountSigner {
  return (signer as SmartAccountSigner).signerType !== undefined
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
