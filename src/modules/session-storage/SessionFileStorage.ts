import { http, type Chain, type Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getRandomSigner } from "../utils/Helper"
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

const getNodeFs = () => {
  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let nodeFs
  try {
    //@ts-ignore
    nodeFs = require("node:fs")
  } catch (error) {
    //@ts-ignore
    // biome-ignore lint/style/useNodejsImportProtocol: <explanation>
    nodeFs = require("fs")
  }
  return nodeFs
}

const DIRECTORY_NAME = "sessionStorageData"

export class SessionFileStorage implements ISessionStorage {
  public smartAccountAddress: Hex
  private storeUrl: string

  constructor(smartAccountAddress: Hex, url?: string) {
    this.smartAccountAddress = smartAccountAddress.toLowerCase() as Hex

    const defaultedDirectory = url ?? __dirname
    this.storeUrl = [defaultedDirectory, DIRECTORY_NAME].join("/")
    this.createDirectory()
  }

  private createDirectory(): void {
    const nodeFs = getNodeFs()
    if (!nodeFs.existsSync(this.storeUrl)) {
      nodeFs.mkdirSync(this.storeUrl)
    }
  }

  // This method reads data from the file and returns it in the JSON format
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private async readDataFromFile(type: "sessions" | "signers"): Promise<any> {
    return new Promise((resolve) => {
      const nodeFs = getNodeFs()
      nodeFs.readFile(
        this.getStorageFilePath(type),
        "utf8",
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (err: any, data: any) => {
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
        }
      )
    })
  }

  private getStorageFilePath(type: "sessions" | "signers"): string {
    return `${this.storeUrl}/${this.smartAccountAddress}_${type}.json`
  }

  private async writeDataToFile(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data: any,
    type: "sessions" | "signers"
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = this.getStorageFilePath(type)
      const nodeFs = getNodeFs()
      nodeFs.writeFile(
        filePath,
        JSON.stringify(data),
        "utf8",
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (err: any) => {
          if (err) {
            // Handle errors appropriately
            reject(err)
          } else {
            resolve()
          }
        }
      )
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
    signerData: SignerData | undefined,
    chain: Chain
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
    sessionPublicKey: string,
    chain: Chain
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
    param: SessionSearchParam,
    chain: Chain
  ): Promise<WalletClientSigner> {
    const session = await this.getSessionData(param)
    Logger.log("got session")
    const signer = await this.getSignerByKey(session.sessionPublicKey, chain)
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
