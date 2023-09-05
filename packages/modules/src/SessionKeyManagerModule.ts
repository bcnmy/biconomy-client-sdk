import { Signer, ethers } from 'ethers'
import MerkleTree from 'merkletreejs'
import { NODE_CLIENT_URL, Logger } from '@biconomy/common'
import { hexConcat, arrayify, hexZeroPad, defaultAbiCoder, Bytes } from 'ethers/lib/utils'
import { keccak256 } from 'ethereumjs-util'
import {
  SessionKeyManagerModuleConfig,
  ModuleVersion,
  CreateSessionDataParams,
  StorageType,
  ModuleInfo
} from './utils/Types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { generateRandomHex } from './utils/Uid'
import { BaseValidationModule } from './BaseValidationModule'
import { SessionLocalStorage } from './session-storage/SessionLocalStorage'
import {
  ISessionStorage,
  SessionLeafNode,
  SessionSearchParam,
  SessionStatus
} from './interfaces/ISessionStorage'

export class SessionKeyManagerModule extends BaseValidationModule {
  version: ModuleVersion = 'V1_0_0'
  moduleAddress!: string
  nodeClient!: INodeClient
  merkleTree!: MerkleTree
  sessionStorageClient!: ISessionStorage
  readonly mockEcdsaSessionKeySig: string =
    '0x73c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b'

  // Review if necessary to store in this format or some mapping
  private dummySig!: string

  /**
   * This constructor is private. Use the static create method to instantiate SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns An instance of SessionKeyManagerModule
   */
  private constructor(moduleConfig: SessionKeyManagerModuleConfig) {
    super(moduleConfig)
  }

  /**
   * Asynchronously creates and initializes an instance of SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns A Promise that resolves to an instance of SessionKeyManagerModule
   */
  public static async create(
    moduleConfig: SessionKeyManagerModuleConfig
  ): Promise<SessionKeyManagerModule> {
    const instance = new SessionKeyManagerModule(moduleConfig)

    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version]
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`)
      }
      instance.moduleAddress = moduleAddr
      instance.version = moduleConfig.version as ModuleVersion
    }
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
   * @param leafData The data to be used to create session data
   * @returns The session data
   */
  createSessionData = async (leafData: CreateSessionDataParams): Promise<string> => {
    const sessionKeyManagerModuleABI = 'function setMerkleRoot(bytes32 _merkleRoot)'
    const sessionKeyManagerModuleInterface = new ethers.utils.Interface([
      sessionKeyManagerModuleABI
    ])
    const leafDataHex = hexConcat([
      hexZeroPad(ethers.utils.hexlify(leafData.validUntil), 6),
      hexZeroPad(ethers.utils.hexlify(leafData.validAfter), 6),
      hexZeroPad(leafData.sessionValidationModule, 20),
      leafData.sessionKeyData
    ])
    this.merkleTree.addLeaves([ethers.utils.keccak256(leafDataHex) as unknown as Buffer])

    const leaves = this.merkleTree.getLeaves()

    const newMerkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: false
    })

    this.merkleTree = newMerkleTree

    const setMerkleRootData = sessionKeyManagerModuleInterface.encodeFunctionData('setMerkleRoot', [
      this.merkleTree.getHexRoot()
    ])
    const sessionLeafNode = {
      ...leafData,
      sessionID: generateRandomHex(),
      status: 'PENDING' as SessionStatus
    }

    await this.sessionStorageClient.addSessionData(sessionLeafNode)
    await this.sessionStorageClient.setMerkleRoot(this.merkleTree.getHexRoot())
    // TODO: create a signer if sessionPubKey if not given
    return setMerkleRootData
  }

  /**
   * This method is used to sign the user operation using the session signer
   * @param userOp The user operation to be signed
   * @param sessionSigner The signer to be used to sign the user operation
   * @returns The signature of the user operation
   */
  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string> {
    if (!(params && params.sessionSigner)) {
      throw new Error('Session signer is not provided.')
    }
    const sessionSigner = params.sessionSigner
    // Use the sessionSigner to sign the user operation
    const signature = await sessionSigner.signMessage(arrayify(userOpHash))

    const sessionSignerData = await this.getLeafInfo(params)

    const leafDataHex = hexConcat([
      hexZeroPad(ethers.utils.hexlify(sessionSignerData.validUntil), 6),
      hexZeroPad(ethers.utils.hexlify(sessionSignerData.validAfter), 6),
      hexZeroPad(sessionSignerData.sessionValidationModule, 20),
      sessionSignerData.sessionKeyData
    ])

    // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
    let paddedSignature = defaultAbiCoder.encode(
      ['uint48', 'uint48', 'address', 'bytes', 'bytes32[]', 'bytes'],
      [
        sessionSignerData.validUntil,
        sessionSignerData.validAfter,
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        this.merkleTree.getHexProof(ethers.utils.keccak256(leafDataHex) as unknown as Buffer),
        signature
      ]
    )

    if (params?.additionalSessionData) {
      paddedSignature += params.additionalSessionData
    }

    return paddedSignature
  }

  private async getLeafInfo(params: ModuleInfo): Promise<SessionLeafNode> {
    if (!(params && params.sessionSigner)) {
      throw new Error('Session signer is not provided.')
    }
    const sessionSigner = params.sessionSigner
    let sessionSignerData
    if (params?.sessionID) {
      sessionSignerData = await this.sessionStorageClient.getSessionData({
        sessionID: params.sessionID
      })
    } else if (params?.sessionValidationModule) {
      sessionSignerData = await this.sessionStorageClient.getSessionData({
        sessionValidationModule: params.sessionValidationModule,
        sessionPublicKey: await sessionSigner.getAddress()
      })
    } else {
      throw new Error('sessionID or sessionValidationModule should be provided.')
    }

    return sessionSignerData
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
  // instead of search params it could be actual leaf info retrieved beforehand
  async getDummySignature(params?: ModuleInfo): Promise<string> {
    Logger.log('moduleInfo ', params)
    if (!params) {
      throw new Error('Session signer is not provided.')
    }
    const sessionSignerData = await this.getLeafInfo(params)
    const leafDataHex = hexConcat([
      hexZeroPad(ethers.utils.hexlify(sessionSignerData.validUntil), 6),
      hexZeroPad(ethers.utils.hexlify(sessionSignerData.validAfter), 6),
      hexZeroPad(sessionSignerData.sessionValidationModule, 20),
      sessionSignerData.sessionKeyData
    ])

    // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
    let paddedSignature = defaultAbiCoder.encode(
      ['uint48', 'uint48', 'address', 'bytes', 'bytes32[]', 'bytes'],
      [
        sessionSignerData.validUntil,
        sessionSignerData.validAfter,
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        this.merkleTree.getHexProof(ethers.utils.keccak256(leafDataHex) as unknown as Buffer),
        this.mockEcdsaSessionKeySig
      ]
    )

    if (params?.additionalSessionData) {
      paddedSignature += params.additionalSessionData
    }

    return paddedSignature
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
