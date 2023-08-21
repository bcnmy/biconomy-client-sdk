import { Signer, ethers, Bytes } from 'ethers'
import MerkleTree from 'merkletreejs'
import { getUserOpHash, NODE_CLIENT_URL } from '@biconomy/common'
import { hexConcat, arrayify, keccak256, hexZeroPad, defaultAbiCoder } from 'ethers/lib/utils'
import {
  SessionKeyManagerModuleConfig,
  ModuleVersion,
  CreateSessionDataParams
} from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { BaseValidationModule } from './BaseValidationModule'
import { SessionLocalStorage } from 'session-storage/SessionLocalStorage'
import { SessionSearchParam, SessionStatus } from 'interfaces/ISessionStorage'
import { generateRandomHex } from 'utils/UID'

export class SessionKeyManagerModule extends BaseValidationModule {
  chainId!: ChainId
  version: ModuleVersion = 'V1_0_0'
  moduleAddress!: string
  nodeClient!: INodeClient
  merkleTree!: MerkleTree
  sessionStorageClient!: SessionLocalStorage

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
    instance.chainId = moduleConfig.chainId
    instance.nodeClient = new NodeClient({
      txServiceUrl: moduleConfig.nodeClientUrl ?? NODE_CLIENT_URL
    })

    instance.sessionStorageClient = new SessionLocalStorage(moduleConfig.smartAccountAddress)

    const existingSessionData = await instance.sessionStorageClient.getAllSessionData()
    const existingSessionDataLeafs = existingSessionData.map((sessionData) => {
      const leafDataHex = hexConcat([
        hexZeroPad(ethers.utils.hexlify(sessionData.validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(sessionData.validAfter), 6),
        hexZeroPad(sessionData.sessionValidationModule, 20),
        sessionData.sessionKeyData
      ])
      return Buffer.from(keccak256(leafDataHex))
    })

    instance.merkleTree = new MerkleTree(existingSessionDataLeafs, keccak256, {
      sortPairs: false,
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
    const sessionKeyModuleAbi = 'function setMerkleRoot(bytes32 _merkleRoot)'
    const sessionKeyModuleInterface = new ethers.utils.Interface([sessionKeyModuleAbi])
    const leafDataHex = hexConcat([
      hexZeroPad(ethers.utils.hexlify(leafData.validUntil), 6),
      hexZeroPad(ethers.utils.hexlify(leafData.validAfter), 6),
      hexZeroPad(leafData.sessionValidationModule, 20),
      leafData.sessionKeyData
    ])
    this.merkleTree.addLeaves([Buffer.from(keccak256(leafDataHex))])
    const setMerkleRootData = sessionKeyModuleInterface.encodeFunctionData('setMerkleRoot', [
      this.merkleTree.getHexRoot()
    ])
    const sessionLeafNode = {
      ...leafData,
      sessionID: generateRandomHex(),
      status: 'PENDING' as SessionStatus
    }

    await this.sessionStorageClient.addSessionData(sessionLeafNode)
    return setMerkleRootData
  }

  /**
   * This method is used to sign the user operation using the session signer
   * @param userOp The user operation to be signed
   * @param sessionSigner The signer to be used to sign the user operation
   * @returns The signature of the user operation
   */
  async signUserOp(userOp: UserOperation, sessionSigner: Signer): Promise<string> {
    if (!sessionSigner) {
      throw new Error('Session signer is not provided.')
    }
    // Use the sessionSigner to sign the user operation
    const userOpHash = getUserOpHash(userOp, this.entryPointAddress, this.chainId)
    const signature = await sessionSigner.signMessage(arrayify(userOpHash))

    const sessionSignerData = await this.sessionStorageClient.getSessionData({
      sessionPublicKey: await sessionSigner.getAddress()
    })

    // Generate the padded signature with
    // (validUntil, validAfter, sessionVerificationModuleAddress, validationData, merkleProof, signature)
    const paddedSignature = defaultAbiCoder.encode(
      ['uint48', 'uint48', 'address', 'bytes', 'bytes32[]', 'bytes'],
      [
        sessionSignerData.validUntil,
        sessionSignerData.validAfter,
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        this.merkleTree.getHexRoot(),
        signature
      ]
    )

    // Generate the encoded data with paddedSignature and sessionKeyManagerModuleAddress
    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'address'],
      [paddedSignature, this.getAddress()]
    )
    return signatureWithModuleAddress
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

  // TODO: why this is needed?
  getDummySignature(): string {
    return '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9cf3caaa21db25f16ad6db43eb9932ab77c8e76000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000'
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
    throw new Error('Method not implemented.')
  }
}
