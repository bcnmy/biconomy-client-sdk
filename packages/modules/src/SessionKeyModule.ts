import { Signer, ethers } from 'ethers'
import MerkleTree from 'merkletreejs'
import { Bytes, hexConcat, arrayify, hexZeroPad, keccak256 } from 'ethers/lib/utils'
import { EntryPoint_v100, EntryPoint_v100__factory } from '@biconomy/common'
import { UserOperation } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { ECDSAOwnershipValidationModuleConfig } from './utils/Types'
import { DEFAULT_SESSION_KEY_MODULE, DEFAULT_ENTRYPOINT_ADDRESS } from './utils/Constants'
import { BaseValidationModule } from './BaseValidationModule'

export class SessionKeyManagerModule extends BaseValidationModule {
  sessionKey: Signer
  nodeClient!: INodeClient
  entryPoint!: EntryPoint_v100
  sessionKeyModule!: string

  constructor(moduleConfig: ECDSAOwnershipValidationModuleConfig) {
    super(moduleConfig)
    this.sessionKey = moduleConfig.signer
    if (!moduleConfig.entryPoint) {
      const ep = EntryPoint_v100__factory.connect(DEFAULT_ENTRYPOINT_ADDRESS, moduleConfig.signer)
      this.entryPoint = ep
    } else {
      this.entryPoint = moduleConfig.entryPoint
    }
    this.sessionKeyModule = moduleConfig.sessionKeyModule || DEFAULT_SESSION_KEY_MODULE
    this.nodeClient = new NodeClient({ txServiceUrl: 'https://sdk-backend.prod.biconomy.io/v1' })
  }

  // returns the address of the session key module
  async getAddress(): Promise<string> {
    return await Promise.resolve(this.sessionKeyModule)
  }

  async getSigner(): Promise<Signer> {
    return await Promise.resolve(this.sessionKey)
  }

  async getInitData(): Promise<string> {
    throw new Error('Method not applicable for this module')
  }

  async createSession(): Promise<string> {
    const sessionKeyModuleAbi = 'function setMerkleRoot(bytes32 _merkleRoot)'
    const sessionKeyModuleInterface = new ethers.utils.Interface([sessionKeyModuleAbi])
    const setMerkleRootData = sessionKeyModuleInterface.encodeFunctionData('setMerkleRoot', [
      await this.getMerkleProof()
    ])
    return setMerkleRootData
  }

  async signUserOp(userOperation: UserOperation): Promise<string> {
    const userOpHash = await this.entryPoint.getUserOpHash({
      ...userOperation,
      signature: '0x'
    })
    const signature = await this.sessionKey.signMessage(arrayify(userOpHash))
    // add validator module address to the signature
    const signatureWithModuleAddress = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'address'],
      [signature, this.sessionKey]
    )
    userOperation.signature = signatureWithModuleAddress
    // TODO: return userOp or signatureWithModuleAddress?
    return signatureWithModuleAddress
  }

  async signMessage(message: Bytes | string): Promise<string> {
    return await this.sessionKey.signMessage(message)
  }

  async getMerkleProof(): Promise<string> {
    // TODO: use nodeclient to get merkle proof
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
    const sessionEOA = await this.sessionKey.getAddress()
    const sessionKeyData = hexZeroPad(sessionEOA, 20)
    const newLeafData = hexConcat([
      hexZeroPad(ethers.utils.hexlify(validUntil), 6),
      hexZeroPad(ethers.utils.hexlify(validAfter), 6),
      hexZeroPad(this.sessionKeyModule, 20),
      sessionKeyData
    ])

    // Todo: verify addLeaves expects buffer
    merkleTreeInstance.addLeaves([Buffer.from(keccak256(newLeafData))])

    return merkleTreeInstance.getHexRoot()
  }
}
