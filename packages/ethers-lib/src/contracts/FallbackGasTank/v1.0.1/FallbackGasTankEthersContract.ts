import { BigNumber } from '@ethersproject/bignumber'
import { FallbackGasTankContract } from '@biconomy/core-types'
import {
  FallbackGasTankContractV101 as Fallback_Type,
  FallbackUserOperationStruct
} from '../../../../typechain/src/ethers-v5/v1.0.1/FallbackGasTankContractV101'
import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'

class FallbackGasTankEthersContract implements FallbackGasTankContract {
  constructor(public contract: Fallback_Type) {}

  getAddress(): string {
    return this.contract.address
  }

  getContract(): Contract {
    return this.contract
  }

  async getBalance(_dappIdentifier: string): Promise<BigNumber> {
    return this.contract.getBalance(_dappIdentifier)
  }

  async getNonce(_sender: string): Promise<BigNumber> {
    return this.contract.getNonce(_sender)
  }

  async getHash(fallbackUserOp: FallbackUserOperationStruct): Promise<string> {
    return this.contract.getHash(fallbackUserOp)
  }

  getInterface(): Interface {
    return this.contract.interface
  }
}

export default FallbackGasTankEthersContract
