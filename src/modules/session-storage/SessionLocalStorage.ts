import { http, type Chain, type Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { type SmartAccountSigner, WalletClientSigner } from "../../account"
import { getRandomSigner } from "../../index.js"
import type {
  ISessionStorage,
  SessionLeafNode,
  SessionSearchParam,
  SessionStatus
} from "../interfaces/ISessionStorage.js"
import type { SignerData } from "../utils/Types.js"

// @ts-ignore
export const inBrowser = typeof window !== "undefined"
export const supportsLocalStorage =
  // @ts-ignore: LocalStorage is not available in node
  inBrowser && typeof window.localStorage !== "undefined"

export class SessionLocalStorage implements ISessionStorage {
  public smartAccountAddress: Hex

  constructor(smartAccountAddress: Hex) {
    this.smartAccountAddress = smartAccountAddress.toLowerCase() as Hex
  }

  private validateSearchParam(param: SessionSearchParam): void {
    if (
      param.sessionID ||
      (!param.sessionID &&
        param.sessionPublicKey &&
        param.sessionValidationModule)
    ) {
      return
    }
    throw new Error(
      "Either pass sessionId or a combination of sessionPublicKey and sessionValidationModule address."
    )
  }
  private getSessionStore() {
    // @ts-ignore: LocalStorage is not available in node
    const data = localStorage.getItem(this.getStorageKey("sessions"))
    return data ? JSON.parse(data) : { merkleRoot: "", leafNodes: [] }
  }

  private getSignerStore(): Record<string, SignerData> {
    // @ts-ignore: LocalStorage is not available in node
    const data = localStorage.getItem(this.getStorageKey("signers"))
    return data ? JSON.parse(data) : {}
  }

  private getStorageKey(type: "sessions" | "signers"): string {
    return `${this.smartAccountAddress}_${type}`
  }

  private toLowercaseAddress(address: string): string {
    return address.toLowerCase()
  }

  async addSessionData(leaf: SessionLeafNode): Promise<void> {
    const data = this.getSessionStore()
    leaf.sessionValidationModule = this.toLowercaseAddress(
      leaf.sessionValidationModule
    ) as Hex
    leaf.sessionPublicKey = this.toLowercaseAddress(
      leaf.sessionPublicKey
    ) as Hex
    data.leafNodes.push(leaf)
    // @ts-ignore: LocalStorage is not available in node
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data))
  }

  async getSessionData(param: SessionSearchParam): Promise<SessionLeafNode> {
    this.validateSearchParam(param)

    const sessions = this.getSessionStore().leafNodes
    const session = sessions.find((s: SessionLeafNode) => {
      if (param.sessionID) {
        return (
          s.sessionID === param.sessionID &&
          (!param.status || s.status === param.status)
        )
      }
      if (param.sessionPublicKey && param.sessionValidationModule) {
        return (
          s.sessionPublicKey ===
            this.toLowercaseAddress(param.sessionPublicKey) &&
          s.sessionValidationModule ===
            this.toLowercaseAddress(param.sessionValidationModule) &&
          (!param.status || s.status === param.status)
        )
      }
      return undefined
    })

    if (!session) {
      throw new Error("Session not found.")
    }
    return session
  }

  async updateSessionStatus(
    param: SessionSearchParam,
    status: SessionStatus
  ): Promise<void> {
    this.validateSearchParam(param)

    const data = this.getSessionStore()
    const session = data.leafNodes.find((s: SessionLeafNode) => {
      if (param.sessionID) {
        return s.sessionID === param.sessionID
      }
      if (param.sessionPublicKey && param.sessionValidationModule) {
        return (
          s.sessionPublicKey ===
            this.toLowercaseAddress(param.sessionPublicKey) &&
          s.sessionValidationModule ===
            this.toLowercaseAddress(param.sessionValidationModule)
        )
      }
      return undefined
    })

    if (!session) {
      throw new Error("Session not found.")
    }

    session.status = status
    // @ts-ignore: LocalStorage is not available in node
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data))
  }

  async clearPendingSessions(): Promise<void> {
    const data = this.getSessionStore()
    data.leafNodes = data.leafNodes.filter(
      (s: SessionLeafNode) => s.status !== "PENDING"
    )
    // @ts-ignore: LocalStorage is not available in node
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data))
  }

  async addSigner(
    signerData: SignerData,
    chain: Chain
  ): Promise<SmartAccountSigner> {
    const signers = this.getSignerStore()
    const signer: SignerData = signerData ?? getRandomSigner()
    const accountSigner = privateKeyToAccount(signer.pvKey)
    const client = createWalletClient({
      account: accountSigner,
      chain,
      transport: http()
    })
    const walletClientSigner = new WalletClientSigner(
      client,
      "json-rpc" // signerType
    )
    signers[this.toLowercaseAddress(accountSigner.address)] = signer
    // @ts-ignore: LocalStorage is not available in node
    localStorage.setItem(this.getStorageKey("signers"), JSON.stringify(signers))
    return walletClientSigner
  }

  async getSignerByKey(
    sessionPublicKey: string,
    chain: Chain
  ): Promise<SmartAccountSigner> {
    const signers = this.getSignerStore()
    const signerData = signers[this.toLowercaseAddress(sessionPublicKey)]
    if (!signerData) {
      throw new Error("Signer not found.")
    }
    const account = privateKeyToAccount(signerData.pvKey)
    const client = createWalletClient({
      account,
      chain,
      transport: http()
    })
    const signer = new WalletClientSigner(client, "viem")
    return signer
  }

  async getSignerBySession(
    param: SessionSearchParam,
    chain: Chain
  ): Promise<SmartAccountSigner> {
    const session = await this.getSessionData(param)
    return this.getSignerByKey(session.sessionPublicKey, chain)
  }

  async getAllSessionData(
    param?: SessionSearchParam
  ): Promise<SessionLeafNode[]> {
    const sessions = this.getSessionStore().leafNodes
    if (!param || !param.status) {
      return sessions
    }
    return sessions.filter((s: SessionLeafNode) => s.status === param.status)
  }

  async revokeSessions(sessionIDs: string[]): Promise<any[]> {
    const data = this.getSessionStore()
    let newLeafNodes: any[] = []
    for (const sessionID of sessionIDs) {
      newLeafNodes = data.leafNodes.filter((s: SessionLeafNode) => {
        if (sessionID) {
          return s.sessionID !== sessionID
        }
        return undefined
      })
    }
    return newLeafNodes
  }

  async getMerkleRoot(): Promise<string> {
    return this.getSessionStore().merkleRoot
  }

  setMerkleRoot(merkleRoot: string): Promise<void> {
    const data = this.getSessionStore()
    data.merkleRoot = merkleRoot
    // @ts-ignore: LocalStorage is not available in node
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data))
    return Promise.resolve()
  }
}
