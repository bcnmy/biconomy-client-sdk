import { UserOperation, ChainId } from '@biconomy/core-types'
import { Logger, getUserOpHash } from '@biconomy/common'
import { ethers } from 'ethers'
import MerkleTree from 'merkletreejs'
import { ECDSAOwnershipValidationModule } from './ECDSAOwnershipValidationModule'
import { MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION } from './utils/Constants'
import { keccak256, arrayify, defaultAbiCoder, hexConcat, hexZeroPad } from 'ethers/lib/utils'
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
    return '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000002E817fe3749B81dA801fc08B247E081ec20eB080000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000'
  }

  async signUserOp(userOp: UserOperation): Promise<string> {
    Logger.log('userOp', userOp)
    throw new Error('Method not implemented.')
  }

  async signUserOps(multiChainUserOps: MultiChainUserOpDto[]): Promise<UserOperation[]> {
    const leaves: string[] = []

    // TODO
    const validUntil = 0 // unlimited
    const validAfter = 0

    // TODO // error handling

    // Iterate over each userOp and process them
    for (const multiChainOp of multiChainUserOps) {
      const leaf = hexConcat([
        hexZeroPad(ethers.utils.hexlify(validUntil), 6),
        hexZeroPad(ethers.utils.hexlify(validAfter), 6),
        hexZeroPad(
          getUserOpHash(multiChainOp.userOp, this.entryPointAddress, multiChainOp.chainId),
          32
        )
      ])

      leaves.push(keccak256(leaf))
    }

    // Create a new Merkle tree using the leaves array
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true })

    const multichainSignature = await this.signer.signMessage(arrayify(merkleTree.getHexRoot()))

    // Create an array to store updated userOps
    const updatedUserOps: UserOperation[] = []

    Logger.log('merkle root ', merkleTree.getHexRoot())

    for (let i = 0; i < leaves.length; i++) {
      const merkleProof = merkleTree.getHexProof(leaves[i])

      Logger.log('merkle proof ', merkleProof)

      // Create the moduleSignature
      const moduleSignature = defaultAbiCoder.encode(
        ['uint48', 'uint48', 'bytes32', 'bytes32[]', 'bytes'],
        [validUntil, validAfter, merkleTree.getHexRoot(), merkleProof, multichainSignature]
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
