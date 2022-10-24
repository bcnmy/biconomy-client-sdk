import SmartAccount from '@biconomy-sdk/smart-account'
import { LocalRelayer } from '@biconomy-sdk/relayer'
import { Contract, ethers, Signer as AbstractSigner } from 'ethers'
import {
  JsonRpcProvider,
  TransactionReceipt,
  TransactionResponse,
  Web3Provider
} from '@ethersproject/providers'

import chaiAsPromised from 'chai-as-promised'
import * as chai from 'chai'
const nock = require('nock')

const { expect } = chai.use(chaiAsPromised)

import NodeClient from '../dist/src'

import { EstimateRequiredTxGasDto } from '../src/types/NodeClientTypes'

type EthereumInstance = {
  chainId?: number
  provider?: Web3Provider
  signer?: AbstractSigner
}

enum ChainId {
  // Ethereum
  MAINNET = 1,
  GOERLI = 5,
  POLYGON_MUMBAI = 80001,
  POLYGON_MAINNET = 137,
  BSC_TESTNET = 97,
  BSC_MAINNET = 56,
  GANACHE = 1337 //Temp
}

describe('Node Client', function () {
  const ethnode: EthereumInstance = {}
  let relayer: LocalRelayer
  let smartAccount: SmartAccount
  let nodeClient: NodeClient

  before(async () => {
    nodeClient = new NodeClient({ txServiceUrl: 'https://sdk-backend.staging.biconomy.io/v1' })
  })

  beforeEach(async () => { })

  after(async () => { })

  describe('Gas Estimation Endpoints', () => {
    beforeEach(async () => {
      // prepare data...
    })

    it('Should estimate targetTxGas accurately', async () => {

      // deets 1
      /* Wallet  - deployed
         Network - Goerli
         Transaction action - approve USDC + Hyphen LP
         Token balance ? - Yes
        Address - 0xca4ef06cd2903684d3b4ed6d5616f23d73fe1f36
      */

      const requiredTxGasDto: EstimateRequiredTxGasDto = {
        "chainId": 5,
        "walletAddress": "0xcA4Ef06cD2903684d3B4ed6d5616f23D73FE1F36",
        "transaction": {
          "to": "0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0",
          "value": 0,
          "data": "0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000013200b5b640e6414b6def4fc9b3c1eef373925effeccf00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000f9af530ab07796b1ec5706fc448d315a4586fda900000000000000000000000000000000000000000000000000000000000f424000f9af530ab07796b1ec5706fc448d315a4586fda90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004414fe72aa000000000000000000000000b5b640e6414b6def4fc9b3c1eef373925effeccf00000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000",
          "operation": 1
        }
      }

      const response = await nodeClient.estimateRequiredTxGas(requiredTxGasDto);
      console.log(response);

      expect(response.code).to.be.equal(200);
    })
  })

})