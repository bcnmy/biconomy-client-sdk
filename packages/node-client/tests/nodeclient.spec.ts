import { Signer as AbstractSigner } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import chaiAsPromised from 'chai-as-promised'
import * as chai from 'chai'

const { expect } = chai.use(chaiAsPromised)

import NodeClient from '../dist/src'

// import { EstimateRequiredTxGasDto } from '../src/types/NodeClientTypes'

type EthereumInstance = {
  chainId?: number
  provider?: Web3Provider
  signer?: AbstractSigner
}

describe('Node Client tests', function () {
  const ethnode: EthereumInstance = {}
  let nodeClient: NodeClient
  let gasUsed: number

  // TODO: Add test cases for other environments (QA, DEV)
  before(async () => {
    nodeClient = new NodeClient({ txServiceUrl: 'https://sdk-backend.staging.biconomy.io/v1' })
  })

  describe('Gas Estimation Endpoints', () => {
    // it('Should estimateRequiredTxGas accurately', async () => {
    //   // Wallet  - deployed, Tx - approve USDC + Hyphen LP token
    //   // Multisend - 0xcc8386d4b97515b75a76afea0604b0f7ca055eaf
    //   const requiredTxGasDto: EstimateRequiredTxGasDto = {
    //     chainId: 80001,
    //     walletAddress: '0xa3918d4e201c0a4343d774de7432e0056b891093',
    //     transaction: {
    //       to: '0xcc8386d4b97515b75a76afea0604b0f7ca055eaf',
    //       value: 0,
    //       data: '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000013200da5289fcaaf71d52a80a254da614a192b693e97700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b300000000000000000000000066aad3dc0f9aac8a31e07f0787d3d476489d75d300000000000000000000000000000000000000000000000000000000000f42400066aad3dc0f9aac8a31e07f0787d3d476489d75d30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004414fe72aa000000000000000000000000da5289fcaaf71d52a80a254da614a192b693e97700000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000',
    //       operation: 1
    //     }
    //   }
    //   const response = await nodeClient.estimateRequiredTxGas(requiredTxGasDto)
    //   console.log(response)
    //   expect(response.code).to.be.equal(200)
    // })

    // it('Should estimateUndeployedContractGas accurately', async () => {
    //   // Wallet  - deployed, Tx - approve USDC + Hyphen LP
    //   // Multisend - 0xcc8386d4b97515b75a76afea0604b0f7ca055eaf
    //   const dto = {
    //     chainId: 80001,
    //     version: '1.0.0',
    //     transaction: {
    //       to: '0xcc8386d4b97515b75a76afea0604b0f7ca055eaf',
    //       value: 0,
    //       data: '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000013200da5289fcaaf71d52a80a254da614a192b693e97700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b300000000000000000000000066aad3dc0f9aac8a31e07f0787d3d476489d75d300000000000000000000000000000000000000000000000000000000000f42400066aad3dc0f9aac8a31e07f0787d3d476489d75d30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004414fe72aa000000000000000000000000da5289fcaaf71d52a80a254da614a192b693e97700000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000',
    //       operation: 1,
    //       targetTxGas: 500000
    //     },
    //     walletAddress: '0xa3918d4e201c0a4343d774de7432e0056b891093',
    //     feeRefund: {
    //       baseGas: 0,
    //       gasPrice: 0,
    //       tokenGasPriceFactor: 1,
    //       gasToken: '0x0000000000000000000000000000000000000000',
    //       refundReceiver: '0x0000000000000000000000000000000000000000'
    //     },
    //     signature:
    //       '0x39f5032f1cd30005aa1e35f04394cabfe7de3b6ae6d95b27edd8556064c287bf61f321fead0cf48ca4405d497cc8fc47fc7ff0b7f5c45baa14090a44f2307d8230'
    //   }
    //   const response = await nodeClient.estimateUndeployedContractGas(dto)
    //   gasUsed = response.data.gas
    //   console.log(response)
    //   expect(response.code).to.be.equal(200)
    // })

    // it('Should estimateHandlePaymentGas accurately', async () => {
    //   // Wallet  - deployed, Tx - approve USDC + Hyphen LP
    //   const dto = {
    //     chainId: 80001,
    //     version: '1.0.0',
    //     walletAddress: '0xa3918d4e201c0a4343d774de7432e0056b891093',
    //     feeRefund: {
    //       gasUsed: gasUsed,
    //       baseGas: gasUsed,
    //       gasPrice: 1740,
    //       tokenGasPriceFactor: 1000000,
    //       gasToken: '0xdA5289fCAAF71d52a80A254da614a192b693e977',
    //       refundReceiver: '0xc75Bb3956c596efc6DB663cd3e2f64929d6AB0fc'
    //     }
    //   }
    //   const response = await nodeClient.estimateHandlePaymentGas(dto)
    //   console.log(response)
    //   expect(response.code).to.be.equal(200)
    // })
  })
})
