import { http, type Chain, type Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
  Logger,
  type SmartAccountSigner,
  WalletClientSigner
} from "../../account"
import type {
  ISessionStorage,
  SessionLeafNode,
  SessionSearchParam,
  SessionStatus
} from "../interfaces/ISessionStorage"
import type { SignerData } from "../utils/Types"
import { getRandomSigner } from "../.."

export class SessionFileStorage implements ISessionStorage {
  private smartAccountAddress: string

  constructor(smartAccountAddress: string) {
    this.smartAccountAddress = smartAccountAddress.toLowerCase()
  }

  // This method reads data from the file and returns it in the JSON format
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private async readDataFromFile(type: "sessions" | "signers"): Promise<any> {
    return new Promise((resolve) => {
      // @ts-ignore
      fs.readFile(this.getStorageFilePath(type), "utf8", (err, data) => {
        if (err) {
          // Handle errors appropriately
          resolve(undefined)
        } else {
          if (!data) {
            resolve(null)
          } else {
            resolve(JSON.parse(data))
          }
          //   resolve(JSON.parse(data));
        }
      })
    })
  }

  private getStorageFilePath(type: "sessions" | "signers"): string {
    return `${__dirname}/sessionStorageData/${this.smartAccountAddress}_${type}.json`
  }

  private async writeDataToFile(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data: any,
    type: "sessions" | "signers"
  ): Promise<void> {
    console.log("")
    return new Promise((resolve, reject) => {
      const filePath = this.getStorageFilePath(type)
      // @ts-ignore
      fs.writeFile(filePath, JSON.stringify(data), "utf8", (err) => {
        if (err) {
          // Handle errors appropriately
          console.log({ err }, JSON.stringify(data))
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private validateSearchParam(param: SessionSearchParam): void {
    if (param.sessionID) {
      return
    }
    if (
      !param.sessionID &&
      param.sessionPublicKey &&
      param.sessionValidationModule
    ) {
      return
    }
    throw new Error(
      "Either pass sessionId or a combination of sessionPublicKey and sessionValidationModule address."
    )
  }

  // Session store is in the form of mekrleRoot and leafnodes, each object will have a root and an array of leafNodes.
  private async getSessionStore() {
    try {
      const data = await this.readDataFromFile("sessions")
      return data || { merkleRoot: "", leafNodes: [] }
    } catch (error) {
      // Handle errors appropriately
      console.log({ error })
    }
  }

  private async getSignerStore() {
    try {
      const data = await this.readDataFromFile("signers")
      return data || {}
    } catch (error) {
      console.log({ error })
      // Handle errors appropriately
    }
  }

  // private getStorageKey(type: "sessions" | "signers"): string {
  //   return `${this.smartAccountAddress}_${type}`
  // }

  private toLowercaseAddress(address: string): Hex {
    return address.toLowerCase() as Hex
  }

  async getSessionData(param: SessionSearchParam): Promise<SessionLeafNode> {
    const sessions = (await this.getSessionStore()).leafNodes
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

  async addSessionData(leaf: SessionLeafNode): Promise<void> {
    Logger.log("Add session Data")
    const data = await this.getSessionStore()
    leaf.sessionValidationModule = this.toLowercaseAddress(
      leaf.sessionValidationModule
    )
    leaf.sessionPublicKey = this.toLowercaseAddress(leaf.sessionPublicKey)
    data.leafNodes.push(leaf)
    await this.writeDataToFile(data, "sessions") // Use 'sessions' as the type
  }

  async updateSessionStatus(
    param: SessionSearchParam,
    status: SessionStatus
  ): Promise<void> {
    this.validateSearchParam(param)

    const data = await this.getSessionStore()
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
    await this.writeDataToFile(data, "sessions") // Use 'sessions' as the type
  }

  async clearPendingSessions(): Promise<void> {
    const data = await this.getSessionStore()
    data.leafNodes = data.leafNodes.filter(
      (s: SessionLeafNode) => s.status !== "PENDING"
    )
    await this.writeDataToFile(data, "sessions") // Use 'sessions' as the type
  }

  async addSigner(
    chain: Chain,
    signerData: SignerData
  ): Promise<SmartAccountSigner> {
    const signers = await this.getSignerStore()
    const signer: SignerData = signerData ?? getRandomSigner()
    const accountSigner = privateKeyToAccount(signer.pvKey)
    const client = createWalletClient({
      account: accountSigner,
      chain,
      transport: http()
    })
    const walletClientSigner: SmartAccountSigner = new WalletClientSigner(
      client,
      "json-rpc" // signerType
    )
    signers[this.toLowercaseAddress(accountSigner.address)] = signer
    await this.writeDataToFile(signers, "signers") // Use 'signers' as the type
    return walletClientSigner
  }

  async getSignerByKey(
    chain: Chain,
    sessionPublicKey: string
  ): Promise<WalletClientSigner> {
    const signers = await this.getSignerStore()
    Logger.log("Got signers", signers)

    const signerData: SignerData =
      signers[this.toLowercaseAddress(sessionPublicKey)]

    if (!signerData) {
      throw new Error("Signer not found.")
    }
    Logger.log(signerData.pvKey, "PVKEY")

    const signer = privateKeyToAccount(signerData.pvKey)
    const walletClient = createWalletClient({
      account: signer,
      chain,
      transport: http()
    })
    return new WalletClientSigner(walletClient, "json-rpc")
  }

  async getSignerBySession(
    chain: Chain,
    param: SessionSearchParam
  ): Promise<WalletClientSigner> {
    const session = await this.getSessionData(param)
    Logger.log("got session")
    const signer = await this.getSignerByKey(chain, session.sessionPublicKey)
    return signer
  }

  async getAllSessionData(
    param?: SessionSearchParam
  ): Promise<SessionLeafNode[]> {
    const sessions = (await this.getSessionStore()).leafNodes
    if (!param || !param.status) {
      return sessions
    }
    return sessions.filter((s: SessionLeafNode) => s.status === param.status)
  }

  async getMerkleRoot(): Promise<string> {
    return (await this.getSessionStore()).merkleRoot
  }

  async setMerkleRoot(merkleRoot: string): Promise<void> {
    const data = await this.getSessionStore()
    data.merkleRoot = merkleRoot
    await this.writeDataToFile(data, "sessions") // Use 'sessions' as the type
  }
}
