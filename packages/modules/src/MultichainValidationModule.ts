import { UserOperation, ChainId } from '@biconomy/core-types'
import { Logger, getUserOpHash } from '@biconomy/common'
import MerkleTree from 'merkletreejs'
import { ECDSAOwnershipValidationModule } from "./ECDSAOwnershipValidationModule";
import { MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants";
import { ECDSAOwnershipValidationModuleConfig, ModuleVersion } from "./utils/Types";
export class MultiChainValidationModule extends ECDSAOwnershipValidationModule {

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
       return '0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000F993fc8Dc0EE7aece7abf0d6B6939f9d67875dBa000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000'
    }

    async signUserOp(userOp: UserOperation): Promise<string> {
       Logger.log('userOp', userOp) 
       throw new Error("Method not implemented.");
    }

    async signUserOps(userOps: UserOperation[]): Promise<string[]> {
        Logger.log('userOps', userOps) 
        throw new Error("Method not implemented.");
    }

}