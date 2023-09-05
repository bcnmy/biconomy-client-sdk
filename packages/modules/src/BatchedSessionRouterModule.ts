import { Signer, ethers } from 'ethers'
import MerkleTree from 'merkletreejs'
import { NODE_CLIENT_URL, Logger } from '@biconomy/common'
import { hexConcat, arrayify, hexZeroPad, defaultAbiCoder, Bytes } from 'ethers/lib/utils'
import { keccak256 } from 'ethereumjs-util'
import {
  ModuleVersion,
  CreateSessionDataParams,
  StorageType,
  SessionParams,
  BatchedSessionKeyManagerModuleConfig
} from './utils/Types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import {
  BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION,
  SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE
} from './utils/Constants'
import { generateRandomHex } from './utils/Uid'
import { BaseValidationModule } from './BaseValidationModule'
import { SessionLocalStorage } from './session-storage/SessionLocalStorage'
import { ISessionStorage, SessionSearchParam, SessionStatus } from './interfaces/ISessionStorage'

export class BatchedSessionRouterModule extends BaseValidationModule {
  version: ModuleVersion = 'V1_0_0'
  moduleAddress!: string
  sessionManagerModuleAddress!: string
  nodeClient!: INodeClient
  merkleTree!: MerkleTree
  sessionStorageClient!: ISessionStorage

  /**
   * This constructor is private. Use the static create method to instantiate SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns An instance of SessionKeyManagerModule
   */
  private constructor(moduleConfig: BatchedSessionKeyManagerModuleConfig) {
    super(moduleConfig)
  }

  /**
   * Asynchronously creates and initializes an instance of SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns A Promise that resolves to an instance of SessionKeyManagerModule
   */
  public static async create(
    moduleConfig: BatchedSessionKeyManagerModuleConfig
  ): Promise<BatchedSessionRouterModule> {
    const instance = new BatchedSessionRouterModule(moduleConfig)

    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version]
      if (!moduleAddr) {
        // throw new Error(`Invalid version ${moduleConfig.version}`)
        Logger.error(`Invalid version ${moduleConfig.version}`)
        instance.moduleAddress = DEFAULT_BATCHED_SESSION_ROUTER_MODULE
      }
      instance.moduleAddress = moduleAddr
      instance.version = moduleConfig.version as ModuleVersion
    }

    instance.sessionManagerModuleAddress =
      moduleConfig.sessionManagerModuleAddress ?? DEFAULT_SESSION_KEY_MANAGER_MODULE
    instance.nodeClient = new NodeClient({
      txServiceUrl: moduleConfig.nodeClientUrl ?? NODE_CLIENT_URL
    })

    if (!moduleConfig.storageType || moduleConfig.storageType === StorageType.LOCAL_STORAGE) {
      instance.sessionStorageClient = new SessionLocalStorage(moduleConfig.smartAccountAddress)
    } else {
      throw new Error('Invalid storage type')
    }

    const existingSessionData = await instance.sessionStorageClient.getAllSessionData()
    const existingSessionDataLeafs = existingSessionData.map((sessionData) => {
      const leafDataHex = hexConcat([
        hexZeroPad(ethers.utils.hexlify(sessionData.validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(sessionData.validAfter), 6),
        hexZeroPad(sessionData.sessionValidationModule, 20),
        sessionData.sessionKeyData
      ])
      return ethers.utils.keccak256(leafDataHex)
    })

    instance.merkleTree = new MerkleTree(existingSessionDataLeafs, keccak256, {
      sortPairs: true,
      hashLeaves: false
    })

    return instance
  }

  /**
   * Method to create session data for any module. The session data is used to create a leaf in the merkle tree
   * @param leavesData The data of one or more leaves to be used to create session data
   * @returns The session data
   */
  createSessionData = async (leavesData: CreateSessionDataParams[]): Promise<string> => {
    const sessionKeyManagerModuleABI = 'function setMerkleRoot(bytes32 _merkleRoot)'
    const sessionKeyManagerModuleInterface = new ethers.utils.Interface([
      sessionKeyManagerModuleABI
    ])
    const leavesToAdd: Buffer[] = []

    for (const leafData of leavesData) {
      const leafDataHex = hexConcat([
        hexZeroPad(ethers.utils.hexlify(leafData.validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(leafData.validAfter), 6),
        hexZeroPad(leafData.sessionValidationModule, 20),
        leafData.sessionKeyData
      ])

      leavesToAdd.push(ethers.utils.keccak256(leafDataHex) as unknown as Buffer)

      const sessionLeafNode = {
        ...leafData,
        sessionID: generateRandomHex(),
        status: 'PENDING' as SessionStatus
      }

      await this.sessionStorageClient.addSessionData(sessionLeafNode)
    }

    this.merkleTree.addLeaves(leavesToAdd)

    const leaves = this.merkleTree.getLeaves()

    const newMerkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: false
    })

    this.merkleTree = newMerkleTree

    const setMerkleRootData = sessionKeyManagerModuleInterface.encodeFunctionData('setMerkleRoot', [
      this.merkleTree.getHexRoot()
    ])

    await this.sessionStorageClient.setMerkleRoot(this.merkleTree.getHexRoot())
    // TODO: create a signer if sessionPubKey if not given
    return setMerkleRootData
  }

  /**
   * This method is used to sign the user operation using the session signer
   * @param userOp The user operation to be signed
   * @param sessionParams Information about all the sessions to be used to sign the user operation which has a batch execution
   * @returns The signature of the user operation
   */
  async signUserOpHash(userOpHash: string, sessionParams?: SessionParams[]): Promise<string> {
    if (!sessionParams || sessionParams.length === 0) {
      throw new Error('Session parameters are not provided.')
    }

    const sessionDataArray = []
    const proofs = []

    // signer must be the same for all the sessions
    const sessionSigner = sessionParams[0].sessionSigner

    const userOpHashAndModuleAddress = ethers.utils.hexConcat([
      ethers.utils.hexZeroPad(userOpHash, 32),
      ethers.utils.hexZeroPad(this.getSessionKeyManagerAddress(), 20)
    ])

    const resultingHash = ethers.utils.keccak256(userOpHashAndModuleAddress)

    const signature = await sessionSigner.signMessage(arrayify(resultingHash))

    for (const sessionParam of sessionParams) {
      if (!sessionParam.sessionSigner) {
        throw new Error('Session signer is not provided.')
      }

      let sessionSignerData

      if (sessionParam.sessionID) {
        sessionSignerData = await this.sessionStorageClient.getSessionData({
          sessionID: sessionParam.sessionID
        })
      } else if (sessionParam.sessionValidationModule) {
        sessionSignerData = await this.sessionStorageClient.getSessionData({
          sessionValidationModule: sessionParam.sessionValidationModule,
          sessionPublicKey: await sessionSigner.getAddress()
        })
      } else {
        throw new Error('sessionID or sessionValidationModule should be provided.')
      }

      sessionDataArray.push(sessionSignerData)

      const leafDataHex = hexConcat([
        hexZeroPad(ethers.utils.hexlify(sessionSignerData.validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(sessionSignerData.validAfter), 6),
        hexZeroPad(sessionSignerData.sessionValidationModule, 20),
        sessionSignerData.sessionKeyData
      ])

      const proof = this.merkleTree.getHexProof(
        ethers.utils.keccak256(leafDataHex) as unknown as Buffer
      )
      proofs.push(proof)
    }

    // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
    const paddedSignature = defaultAbiCoder.encode(
      ['address', 'uint48[]', 'uint48[]', 'address[]', 'bytes[]', 'bytes32[][]', 'bytes'],
      [
        this.getSessionKeyManagerAddress(),
        sessionDataArray.map((data) => data.validUntil),
        sessionDataArray.map((data) => data.validAfter),
        sessionDataArray.map((data) => data.sessionValidationModule),
        sessionDataArray.map((data) => data.sessionKeyData),
        proofs,
        signature
      ]
    )

    return paddedSignature
  }

  /**
   * Update the session data pending state to active
   * @param param The search param to find the session data
   * @param status The status to be updated
   * @returns
   */
  async updateSessionStatus(param: SessionSearchParam, status: SessionStatus) {
    this.sessionStorageClient.updateSessionStatus(param, status)
  }

  /**
   * @remarks This method is used to clear all the pending sessions
   * @returns
   */
  async clearPendingSessions() {
    this.sessionStorageClient.clearPendingSessions()
  }

  /**
   * @returns SessionKeyManagerModule address
   */
  getAddress(): string {
    return this.moduleAddress
  }

  /**
   * @returns SessionKeyManagerModule address
   */
  getSessionKeyManagerAddress(): string {
    return this.sessionManagerModuleAddress
  }

  /**
   * @remarks This is the version of the module contract
   */
  async getSigner(): Promise<Signer> {
    throw new Error('Method not implemented.')
  }

  /**
   * @remarks This is the dummy signature for the module, used in buildUserOp for bundler estimation
   * @returns Dummy signature
   */
  // Review
  getDummySignature(): string {
    const moduleAddress = ethers.utils.getAddress(this.getAddress())
    const dynamicPart = moduleAddress.substring(2).padEnd(40, '0')
    return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000db3d753a1da5a6074a9f74f39a0a779d3300000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000080000000000000000000000000bfe121a6dcf92c49f6c2ebd4f306ba0ba0ab6f1c000000000000000000000000da5289fcaaf71d52a80a254da614a192b693e97700000000000000000000000042138576848e839827585a3539305774d36b96020000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041feefc797ef9e9d8a6a41266a85ddf5f85c8f2a3d2654b10b415d348b150dabe82d34002240162ed7f6b7ffbc40162b10e62c3e35175975e43659654697caebfe1c00000000000000000000000000000000000000000000000000000000000000`
  }

  /**
   * @remarks Other modules may need additional attributes to build init data
   */
  async getInitData(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  /**
   * @remarks This Module dont have knowledge of signer. So, this method is not implemented
   */
  async signMessage(message: Bytes | string): Promise<string> {
    Logger.log('message', message)
    throw new Error('Method not implemented.')
  }
}