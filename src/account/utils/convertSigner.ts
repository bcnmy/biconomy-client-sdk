import {
  http,
  type PrivateKeyAccount,
  type WalletClient,
  createWalletClient
} from "viem"
import { ERROR_MESSAGES, WalletClientSigner } from "../../account"
import type { Signer, SmartAccountSigner, SupportedSigner } from "../../account"
import { EthersSigner } from "./EthersSigner.js"

interface SmartAccountResult {
  signer: SmartAccountSigner
}

function isPrivateKeyAccount(
  signer: SupportedSigner
): signer is PrivateKeyAccount {
  return (signer as PrivateKeyAccount).type === "local"
}

export function isWalletClient(
  signer: SupportedSigner
): signer is WalletClient {
  return (signer as WalletClient).name === "Wallet Client"
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
  rpcUrl?: string
): Promise<SmartAccountResult> => {
  let resolvedSmartAccountSigner: SmartAccountSigner

  if (!isAlchemySigner(signer)) {
    if (isEthersSigner(signer)) {
      const ethersSigner = signer as Signer
      if (!rpcUrl) throw new Error(ERROR_MESSAGES.MISSING_RPC_URL)
      if (!ethersSigner.provider) {
        throw new Error("Cannot consume an ethers Wallet without a provider")
      }
      // convert ethers Wallet to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new EthersSigner(ethersSigner, "ethers")
    } else if (isWalletClient(signer)) {
      const walletClient = signer as WalletClient
      if (!walletClient.account) {
        throw new Error("Cannot consume a viem wallet without an account")
      }
      // convert viems walletClient to alchemy's SmartAccountSigner under the hood
      resolvedSmartAccountSigner = new WalletClientSigner(walletClient, "viem")
    } else if (isPrivateKeyAccount(signer)) {
      if (!rpcUrl) throw new Error(ERROR_MESSAGES.MISSING_RPC_URL)
      const walletClient = createWalletClient({
        account: signer as PrivateKeyAccount,
        transport: http(rpcUrl)
      })
      resolvedSmartAccountSigner = new WalletClientSigner(walletClient, "viem")
    } else {
      throw new Error("Unsupported signer")
    }
  } else {
    if (!rpcUrl) throw new Error(ERROR_MESSAGES.MISSING_RPC_URL)
    resolvedSmartAccountSigner = signer as SmartAccountSigner
  }
  return {
    signer: resolvedSmartAccountSigner
  }
}
