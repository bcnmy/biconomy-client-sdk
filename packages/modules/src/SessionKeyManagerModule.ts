import { Signer, ethers } from 'ethers'
import MerkleTree from 'merkletreejs'
import { Logger, getUserOpHash, NODE_CLIENT_URL } from '@biconomy/common'
import { EntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import {
  Bytes,
  BytesLike,
  hexConcat,
  arrayify,
  keccak256,
  hexZeroPad,
  hexlify
} from 'ethers/lib/utils'
import {
  BaseValidationModuleConfig,
  SessionKeyManagerModuleConfig,
  ModuleVersion
} from './utils/Types'
import { UserOperation, ChainId } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { BaseValidationModule } from './BaseValidationModule'

// Could be renamed with suffix API
export class SessionKeyManagerModule extends BaseValidationModule {
  // Review
  sessionSigner!: Signer // optional global signer
  sessionPubKey?: string // optional global public key
  chainId: ChainId
  moduleAddress!: string
  DEFAULT_VERSION: ModuleVersion = 'V1_0_0'
  nodeClient!: INodeClient
  merkleTree!: MerkleTree
  // entryPoint!: EntryPoint

  constructor(moduleConfig: SessionKeyManagerModuleConfig) {
    super(moduleConfig)
    if (moduleConfig.moduleAddress) {
      this.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version]
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`)
      }
      this.moduleAddress = moduleAddr
      this.DEFAULT_VERSION = moduleConfig.version as ModuleVersion
    }
    this.sessionSigner = moduleConfig.sessionSigner ?? ethers.Wallet.createRandom()
    this.sessionPubKey = moduleConfig.sessionPubKey
    this.chainId = moduleConfig.chainId
    // this.entryPoint = ... // May not be needed at all
    this.nodeClient = new NodeClient({
      txServiceUrl: moduleConfig.nodeClientUrl ?? NODE_CLIENT_URL
    })
    this.merkleTree = new MerkleTree([hexZeroPad('0x00', 32)], keccak256, { hashLeaves: false })
  }

  // Session Key Manager Module Address
  getAddress(): string {
    return this.moduleAddress
  }

  async getSigner(): Promise<Signer> {
    throw new Error('Method not implemented.')
  }

  // TODO
  getDummySignature(): string {
    return '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9cf3caaa21db25f16ad6db43eb9932ab77c8e76000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000'
  }

  // Note: other modules may need additional attributes to build init data
  async getInitData(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async createSession(): Promise<string> {
    const sessionKeyModuleAbi = 'function setMerkleRoot(bytes32 _merkleRoot)'
    const sessionKeyModuleInterface = new ethers.utils.Interface([sessionKeyModuleAbi])
    const setMerkleRootData = sessionKeyModuleInterface.encodeFunctionData('setMerkleRoot', [
      await this.getMerkleProof()
    ])
    return setMerkleRootData
  }

  async signUserOp(userOp: UserOperation): Promise<string> {
    const userOpHash = getUserOpHash(userOp, this.entryPointAddress, this.chainId)
    //
    const signature = await this.sessionSigner.signMessage(arrayify(userOpHash))
    // add validator module address to the signature

    // Review // Should be done on account side
    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'address'],
      [signature, this.getAddress()]
    )
    userOp.signature = signatureWithModuleAddress
    // TODO: return userOp or signatureWithModuleAddress?
    return signatureWithModuleAddress
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this.sessionSigner.signMessage(message)
  }

  async getMerkleProof(): Promise<string> {
    // TODO: use nodeclient / local storage to get merkle proof

    // const merkleProofData = await this.nodeClient.getMerkleProof(
    //   this.sessionKeyModule,
    //   this.sessionKey.getAddress()
    // )
    // console.log(merkleProofData)

    const merkleProofData: any[] = []

    const merkleTreeInstance = new MerkleTree(merkleProofData, keccak256, {
      sortPairs: false,
      hashLeaves: false
    })

    const validUntil = 0
    const validAfter = 0
    const sessionEOA = await this.sessionSigner.getAddress()
    const sessionKeyData = hexZeroPad(sessionEOA, 20)
    const newLeafData = hexConcat([
      hexZeroPad(ethers.utils.hexlify(validUntil), 6),
      hexZeroPad(ethers.utils.hexlify(validAfter), 6),
      hexZeroPad(this.getAddress(), 20), // TODO // actually session validation module address
      sessionKeyData
    ])

    // Todo: verify addLeaves expects buffer
    merkleTreeInstance.addLeaves([Buffer.from(keccak256(newLeafData))])

    return merkleTreeInstance.getHexRoot()
  }
}
