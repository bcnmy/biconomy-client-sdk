import { UserOperation, ChainId } from '@biconomy/core-types'
import { Logger, getUserOpHash } from '@biconomy/common'
import { ethers } from 'ethers'
import MerkleTree from 'merkletreejs'
import { ECDSAOwnershipValidationModule } from './ECDSAOwnershipValidationModule'
import { MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { keccak256, arrayify, defaultAbiCoder } from 'ethers/lib/utils'
import {
  ECDSAOwnershipValidationModuleConfig,
  ModuleVersion,
  MultiChainUserOpDto
} from './utils/Types'
export class MultiChainValidationModule extends ECDSAOwnershipValidationModule {
  // Review: this.chainId should not be in spec of this class
  // May not inherit from ECDSAOwnershipValidationModule

  constructor(moduleConfig: ECDSAOwnershipValidationModuleConfig) {
    super(moduleConfig)

    if (moduleConfig.moduleAddress) {
      this.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version]
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`)
      }
      this.moduleAddress = moduleAddr
      this.version = moduleConfig.version as ModuleVersion
    }
  }

  // TODO: Actually depends on the module address so maybe we can make it dynamic
  getDummySignature(): string {
    return '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000CCCC01Bef3F9a28814b88aC36a819e96eec47E15000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000'
  }

  async signUserOp(userOp: UserOperation): Promise<string> {
    Logger.log('userOp', userOp)
    throw new Error('Method not implemented.')
  }

  async signUserOps(multiChainUserOps: MultiChainUserOpDto[]): Promise<UserOperation[]> {
    const leaves: string[] = []

    // Iterate over each userOp and process them
    for (const multiChainOp of multiChainUserOps) {
      const userOpHash = getUserOpHash(
        multiChainOp.userOp,
        this.entryPointAddress,
        multiChainOp.chainId
      )
      leaves.push(userOpHash)
    }

    // Create a new Merkle tree using the leaves array
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true })

    const multichainSignature = await this.signer.signMessage(arrayify(merkleTree.getHexRoot()))

    // Create an array to store updated userOps
    const updatedUserOps: UserOperation[] = []

    for (let i = 0; i < leaves.length; i++) {
      const merkleProof = merkleTree.getHexProof(leaves[i])

      // Create the moduleSignature
      const moduleSignature = defaultAbiCoder.encode(
        ['bytes32', 'bytes32[]', 'bytes'],
        [merkleTree.getHexRoot(), merkleProof, multichainSignature]
      )

      // add validation module address to the signature
      const signatureWithModuleAddress = defaultAbiCoder.encode(
        ['bytes', 'address'],
        [moduleSignature, this.getAddress()]
      )

      // Update userOp with the final signature
      const updatedUserOp: UserOperation = {
        ...(multiChainUserOps[i].userOp as UserOperation),
        signature: signatureWithModuleAddress
      }

      updatedUserOps.push(updatedUserOp)
    }
    return updatedUserOps
  }
}
