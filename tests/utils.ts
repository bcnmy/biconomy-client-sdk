import fs from "node:fs"
import {
  http,
  type Chain,
  type Hex,
  type PublicClient,
  type Transaction,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { polygonMumbai } from "viem/chains"
import { s } from "vitest/dist/reporters-P7C2ytIv.js"
import {
  Logger,
  type SmartAccountSigner,
  WalletClientSigner,
  getChain
} from "../src/account"
import {
  extractChainIdFromBundlerUrl,
  extractChainIdFromPaymasterUrl
} from "../src/bundler"
import type { SignerData } from "../src/modules"
import type {
  ISessionStorage,
  SessionLeafNode,
  SessionSearchParam,
  SessionStatus
} from "../src/modules/interfaces/ISessionStorage"

export const getEnvVars = () => {
  const fields = [
    "BUNDLER_URL",
    "E2E_PRIVATE_KEY_ONE",
    "E2E_PRIVATE_KEY_TWO",
    "E2E_BICO_PAYMASTER_KEY_AMOY",
    "E2E_BICO_PAYMASTER_KEY_BASE",
    "CHAIN_ID"
  ]
  const errorFields = fields.filter((field) => !process.env[field])
  if (errorFields.length) {
    throw new Error(
      `Missing environment variable${
        errorFields.length > 1 ? "s" : ""
      }: ${errorFields.join(", ")}`
    )
  }
  return {
    bundlerUrl: process.env.BUNDLER_URL || "",
    privateKey: process.env.E2E_PRIVATE_KEY_ONE || "",
    privateKeyTwo: process.env.E2E_PRIVATE_KEY_TWO || "",
    paymasterUrl: `https://paymaster.biconomy.io/api/v1/80002/${
      process.env.E2E_BICO_PAYMASTER_KEY_AMOY || ""
    }`,
    paymasterUrlTwo: `https://paymaster.biconomy.io/api/v1/84532/${
      process.env.E2E_BICO_PAYMASTER_KEY_BASE || ""
    }`,
    chainId: process.env.CHAIN_ID || "0"
  }
}

export type TestConfig = {
  chain: Chain
  chainId: number
  paymasterUrl: string
  paymasterUrlTwo: string
  bundlerUrl: string
  privateKey: string
  privateKeyTwo: string
}
export const getConfig = (): TestConfig => {
  const {
    paymasterUrl,
    paymasterUrlTwo,
    bundlerUrl,
    chainId: chainIdFromEnv,
    privateKey,
    privateKeyTwo
  } = getEnvVars()
  const chains = [Number.parseInt(chainIdFromEnv)]
  const chainId = chains[0]
  const chain = getChain(chainId)

  try {
    const chainIdFromBundlerUrl = extractChainIdFromBundlerUrl(bundlerUrl)
    chains.push(chainIdFromBundlerUrl)
  } catch (e) {}

  try {
    const chainIdFromPaymasterUrl = extractChainIdFromPaymasterUrl(paymasterUrl)
    chains.push(chainIdFromPaymasterUrl)
  } catch (e) {}

  const allChainsMatch = chains.every((chain) => chain === chains[0])

  if (!allChainsMatch) {
    throw new Error("Chain IDs do not match")
  }

  return {
    chain,
    chainId,
    paymasterUrl,
    paymasterUrlTwo,
    bundlerUrl,
    privateKey,
    privateKeyTwo
  }
}

export const checkBalance = (
  publicClient: PublicClient,
  address: Hex,
  tokenAddress?: Hex
) => {
  if (!tokenAddress) {
    return publicClient.getBalance({ address })
  }
  return publicClient.readContract({
    address: tokenAddress,
    abi: parseAbi([
      "function balanceOf(address owner) view returns (uint balance)"
    ]),
    functionName: "balanceOf",
    // @ts-ignore
    args: [address]
  })
}

export const topUp = async (
  recipient: Hex,
  amount = BigInt(1000000),
  token?: Hex
) => {
  const { chain, privateKey } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const sender = account.address

  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const balanceOfSender = await checkBalance(publicClient, sender, token)
  if (balanceOfSender < amount) {
    throw new Error("Insufficient balance during test setup")
  }

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })

  if (token) {
    await walletClient.writeContract({
      address: token,
      abi: parseAbi([
        "function transfer(address recipient, uint256 amount) external"
      ]),
      functionName: "transfer",
      args: [recipient, amount]
    })
  } else {
    await walletClient.sendTransaction({
      to: recipient,
      value: amount
    })
  }
}

export const getBundlerUrl = (chainId: number) =>
  `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`

export class SessionFileStorage implements ISessionStorage {
  private smartAccountAddress: string

  constructor(smartAccountAddress: string) {
    this.smartAccountAddress = smartAccountAddress.toLowerCase()
  }

  // This method reads data from the file and returns it in the JSON format
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
  private async getSessionStore(): Promise<any> {
    // eslint-disable-next-line no-useless-catch
    try {
      const data = await this.readDataFromFile("sessions")
      return data || { merkleRoot: "", leafNodes: [] }
    } catch (error) {
      // Handle errors appropriately
      console.log({ error })
    }
  }

  private async getSignerStore(): Promise<any> {
    // eslint-disable-next-line no-useless-catch
    try {
      const data = await this.readDataFromFile("signers")
      return data || {}
    } catch (error) {
      console.log({ error })
      // Handle errors appropriately
    }
  }

  private getStorageKey(type: "sessions" | "signers"): string {
    return `${this.smartAccountAddress}_${type}`
  }

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
    Logger.log("Add session Data", leaf)
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

  async addSigner(signerData: SignerData): Promise<WalletClientSigner> {
    const signers = await this.getSignerStore()
    let signer: SignerData
    if (!signerData) {
      const pkey = generatePrivateKey()
      signer = {
        pvKey: pkey,
        pbKey: privateKeyToAccount(pkey).publicKey
      }
    } else {
      signer = signerData
    }
    const accountSigner = privateKeyToAccount(signer.pvKey)
    const viemChain = getChain(signerData?.chainId?.id || 1)
    const client = createWalletClient({
      account: accountSigner,
      chain: signerData.chainId,
      transport: http(viemChain.rpcUrls.default.http[0])
    })
    const walletClientSigner: SmartAccountSigner = new WalletClientSigner(
      client,
      "json-rpc" // signerType
    )
    signers[this.toLowercaseAddress(accountSigner.address)] = {
      pvKey: signer.pvKey,
      pbKey: signer.pbKey
    }
    await this.writeDataToFile(signers, "signers") // Use 'signers' as the type
    return walletClientSigner
  }

  async getSignerByKey(sessionPublicKey: string): Promise<WalletClientSigner> {
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
      transport: http(polygonMumbai.rpcUrls.default.http[0])
    })
    return new WalletClientSigner(walletClient, "json-rpc")
  }

  async getSignerBySession(
    param: SessionSearchParam
  ): Promise<WalletClientSigner> {
    const session = await this.getSessionData(param)
    Logger.log("got session", session)
    const walletClientSinger = await this.getSignerByKey(
      session.sessionPublicKey
    )
    return walletClientSinger
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
