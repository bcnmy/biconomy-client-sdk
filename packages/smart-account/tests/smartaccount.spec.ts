import SmartAccount from '../src/SmartAccount'
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

import hardhat from 'hardhat'
import { deployWalletContracts } from './utils/deploy'
import { BytesLike, Interface } from 'ethers/lib/utils'
import { IWalletTransaction, Transaction } from '@biconomy-sdk/core-types'
import { textSpanContainsPosition } from 'typescript'

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

// import hardhat from 'hardhat'
// import { BytesLike, Interface } from 'ethers/lib/utils'

describe('Wallet integration', function () {
  const ethnode: EthereumInstance = {}
  let relayer: LocalRelayer
  let smartAccount: SmartAccount

  before(async () => {
    // Provider from hardhat without a server instance
    ethnode.provider = new ethers.providers.Web3Provider(hardhat.network.provider.send)
    ethnode.signer = ethnode.provider?.getSigner()
    ethnode.chainId = 1337
  })

  beforeEach(async () => {})

  after(async () => {})

  describe('Smart account usage and basic actions', () => {
    beforeEach(async () => {
      // adds entry point, multiSendCall and fallbackHandler
      const [smartWallet, walletFactory, multiSend, multiSendCallOnly] =
        await deployWalletContracts(ethnode.signer!)

      console.log('base wallet deployed at : ', smartWallet.address)
      console.log('wallet factory deployed at : ', walletFactory.address)
      console.log('multi send deployed at : ', multiSend.address)
      console.log('multi send call deployed at : ', multiSendCallOnly.address)

      const scope = nock('https://sdk-backend.staging.biconomy.io')
        .persist()
        .get('/v1/chains/')
        .reply(200, {
          message: 'Success',
          code: 200,
          data: [
            {
              chainId: 1,
              name: 'Ethereum',
              symbol: 'ETH',
              isL2: false,
              isMainnet: true,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://etherscan.io/address/',
                txHash: 'https://etherscan.io/address/',
                api: 'https://api.etherscan.io/'
              },
              ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
              estimatorAddress: '0xc6e8748a08e591250a3eed526e9455859633c6c4',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x596387b0232540b3b620050dcd747fa7e4d21797',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf6',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0x4C6B185b60a2b9D11d746591C8bA768dcBCF7d18',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0xc313daf8dc1e6991f15068a6ca27d372f08a5455',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl: 'https://kovan.infura.io/v3/d126f392798444609246423b06116c77',
              indexerUrl: '',
              backendNodeUrl: '',
              token: {
                chainId: 1,
                address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
                logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
                isNative: true
              }
            },
            {
              chainId: 137,
              name: 'Polygon',
              symbol: 'MATIC',
              isL2: true,
              isMainnet: true,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://polygonscan.com/address/',
                txHash: 'https://polygonscan.com/address/',
                api: 'https://api.polygonscan.com/'
              },
              ensRegistryAddress: '',
              estimatorAddress: '0xc6e8748a08e591250a3eed526e9455859633c6c4',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x2602cf019a69f40fb7de5a0f3fdb778eee7ed722',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf6',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0x4C6B185b60a2b9D11d746591C8bA768dcBCF7d18',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x140a25bd5b002dceae2754cf12576a2640ddc18e',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xfc942e06c54d08502557fa40e1aa23c5258132d5',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl:
                'https://polygon-mainnet.g.alchemy.com/v2/s6bOKN9QDGXpVbsqzJMl_AHeZHNOCTcM',
              indexerUrl: '',
              backendNodeUrl: '',
              token: {
                chainId: 137,
                address: '0x0000000000000000000000000000000000001010',
                name: 'Polygon Matic',
                symbol: 'Matic',
                decimals: 18,
                logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
                isNative: true
              }
            },
            {
              chainId: 56,
              name: 'BSC Mainnet',
              symbol: 'BNB',
              isL2: true,
              isMainnet: true,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://bscscan.com/address/',
                txHash: 'https://bscscan.com/address/',
                api: 'https://bscscan.com/'
              },
              ensRegistryAddress: '',
              estimatorAddress: '0xc6e8748a08e591250a3eed526e9455859633c6c4',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x596387b0232540b3b620050dcd747fa7e4d21797',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf6',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0x4C6B185b60a2b9D11d746591C8bA768dcBCF7d18',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0xc313daf8dc1e6991f15068a6ca27d372f08a5455',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl: 'https://bsc-dataseed2.binance.org/',
              indexerUrl: '',
              backendNodeUrl: '',
              token: {
                chainId: 56,
                address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                name: 'BNB Coin',
                symbol: 'BNB',
                decimals: 18,
                logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
                isNative: true
              }
            },
            {
              chainId: 5,
              name: 'Goerli',
              symbol: 'ETH',
              isL2: false,
              isMainnet: false,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://goerli.etherscan.io/address/',
                txHash: 'https://goerli.etherscan.io/address/',
                api: 'https://goerli.etherscan.io/'
              },
              ensRegistryAddress: '',
              estimatorAddress: '0x8caefe0d512b8e86c7c1bb59e7473d354cf864ab',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x2602cf019a69f40fb7de5a0f3fdb778eee7ed722',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf6',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0xba63a55b7ee3334044a2100c99acdd93325fc0cb',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x140a25bd5b002dceae2754cf12576a2640ddc18e',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xfc942e06c54d08502557fa40e1aa23c5258132d5',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xfc942e06c54d08502557fa40e1aa23c5258132d5',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl: 'https://eth-goerli.g.alchemy.com/v2/477qAVdmEssSZbEPaUMTZXqyetQx5fxg',
              indexerUrl: '',
              backendNodeUrl: '',
              token: {
                chainId: 5,
                address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
                logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
                isNative: true
              }
            },
            {
              chainId: 80001,
              name: 'Polygon Mumbai',
              symbol: 'MATIC',
              isL2: true,
              isMainnet: false,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://mumbai.polygonscan.com/address/',
                txHash: 'https://mumbai.polygonscan.com/address/',
                api: 'https://api.mumbai.polygonscan.com/'
              },
              ensRegistryAddress: '',
              estimatorAddress: '0x8caefe0d512b8e86c7c1bb59e7473d354cf864ab',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x2602cf019a69f40fb7de5a0f3fdb778eee7ed722',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0xba63a55b7ee3334044a2100c99acdd93325fc0cb',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x140a25bd5b002dceae2754cf12576a2640ddc18e',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xfc942e06c54d08502557fa40e1aa23c5258132d5',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xfc942e06c54d08502557fa40e1aa23c5258132d5',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl:
                'https://polygon-mumbai.g.alchemy.com/v2/7JwWhWSG1vtw6ggm_o_GcYnyNw02oM8b',
              indexerUrl: '',
              backendNodeUrl: '',
              token: {
                chainId: 80001,
                address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                name: 'Polygon Matic',
                symbol: 'Matic',
                decimals: 18,
                logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
                isNative: true
              }
            },
            {
              chainId: 97,
              name: 'BSC Testnet',
              symbol: 'BNB',
              isL2: true,
              isMainnet: false,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://bscscan.com//address/',
                txHash: 'https://bscscan.com/address/',
                api: 'https://bscscan.com/'
              },
              ensRegistryAddress: '',
              estimatorAddress: '0xc6e8748a08e591250a3eed526e9455859633c6c4',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0x596387b0232540b3b620050dcd747fa7e4d21797',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf6',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0x4C6B185b60a2b9D11d746591C8bA768dcBCF7d18',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: '0xc313daf8dc1e6991f15068a6ca27d372f08a5455',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
              indexerUrl: '',
              backendNodeUrl: ''
            },
            {
              chainId: 1337,
              name: 'Ganache',
              symbol: 'ETH',
              isL2: true,
              isMainnet: false,
              description: '',
              blockExplorerUriTemplate: {
                address: 'https://mumbai.polygonscan.com/address/',
                txHash: 'https://mumbai.polygonscan.com/address/',
                api: 'https://api.mumbai.polygonscan.com/'
              },
              ensRegistryAddress: '',
              estimatorAddress: '0xc6e8748a08e591250a3eed526e9455859633c6c4',
              walletFactory: [
                {
                  version: '1.0.0',
                  address: '0x6cedfeec52d852fdacdc6ad4a80f58aab406a898',
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf5',
                  walletCreatedAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"}],"name":"WalletCreated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: walletFactory.address,
                  abi: '',
                  walletCreatedEventName: 'WalletCreated',
                  WalletCreatedEventConfirmations: 6,
                  walletCreatedEventTopicHash:
                    '0xca0b7dde26052d34217ef1a0cee48085a07ca32da0a918609937a307d496bbf6',
                  walletCreatedAbi:
                    '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_proxy","type":"address"},{"indexed":true,"internalType":"address","name":"_implementation","type":"address"},{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"uint256","name":"_index","type":"uint256"}],"name":"WalletCreated","type":"event"}'
                }
              ],
              decoderAddress: '0x4C6B185b60a2b9D11d746591C8bA768dcBCF7d18',
              multiSend: [
                {
                  version: '1.0.0',
                  address: '0xf9dc4a9b8b551f693a10ecb5f931fe2e1a9156f0',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: multiSend.address,
                  abi: ''
                }
              ],
              multiSendCall: [
                {
                  version: '1.0.0',
                  address: '0xa72e2c9ec14ddee494f551aae9885158105f809c',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: multiSendCallOnly.address,
                  abi: ''
                }
              ],
              walletCreatedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts',
              walletCreatedEventHit: false,
              eoaChangedCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/owner',
              eoaChangedEventHit: false,
              updateImplementationCallBackEndpoint:
                'https://sdk-backend.staging.biconomy.io/v1/smart-accounts/implementation',
              updateImplementationEventHit: false,
              wallet: [
                {
                  version: '1.0.0',
                  address: '0xea6eef40eaa8a642022f1697d6ed2ffc0ffe5dfb',
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                },
                {
                  version: '1.0.1',
                  address: smartWallet.address,
                  abi: '',
                  eoaChangedEventName: 'EOAChanged',
                  eoaChangedEventConfirmations: 6,
                  eoaChangedEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  eoaChangedEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_scw","type":"address"},{"indexed":true,"internalType":"address","name":"_oldEOA","type":"address"},{"indexed":true,"internalType":"address","name":"_newEOA","type":"address"}],"name":"EOAChanged","type":"event"}]',
                  updateImplementationEventName: 'UpdateImplementation',
                  updateImplementationEventConfirmations: 6,
                  updateImplementationEventTopicHash:
                    '0xf2c2b1b5312b1e31ad49a7d85acd6322ae6facc51488810b882ecdb4df861cd4',
                  updateImplementationEventAbi:
                    '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_scw","type":"address"},{"indexed":false,"internalType":"string","name":"version","type":"string"},{"indexed":false,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ImplementationUpdated","type":"event"}]'
                }
              ],
              entryPoint: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              fallBackHandler: [
                {
                  version: '1.0.0',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                },
                {
                  version: '1.0.1',
                  address: '0xF05217199F1C25604c67993F11a81461Bc97F3Ab',
                  abi: ''
                }
              ],
              relayerUrl: '',
              providerUrl: 'http://localhost:8545',
              indexerUrl: '',
              backendNodeUrl: ''
            }
          ]
        })
    })

    it('Should init and return details of smart account', async () => {
      const userAddress = (await ethnode.signer?.getAddress()) || ''

      const eoaSigner = ethnode.provider?.getSigner()

      const wallet = new SmartAccount(ethnode.provider!, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.GOERLI, ChainId.GANACHE] // has to be consisttent providers and network names
        // walletProvider: ethnode.provider,
        //backend_url: "http://localhost:3000/v1"
      })

      const smartAccount = await wallet.init()

      if (eoaSigner) {
        const eoa = await eoaSigner.getAddress()
        expect(smartAccount.owner).to.be.equal(eoa)
      }

      console.log(smartAccount.factory().getAddress())

      const signer = await smartAccount.signer.getAddress()

      const address = await smartAccount.address
      console.log('counter factual wallet address: ', address)

      expect(address).to.be.equal(smartAccount.address)

      const isDeployed = await smartAccount.isDeployed(ChainId.GANACHE) /// can pass chainId here
      // Check if the smart wallet is deployed or not
      const state = await smartAccount.getSmartAccountState(ChainId.GANACHE)
      console.log('wallet state')
      expect(isDeployed).to.be.equal(false)
    })

    it('Should deploy smart and return correct state and context', async () => {
      const userAddress = (await ethnode.signer?.getAddress()) || ''
      const eoaSigner = ethnode.provider?.getSigner()

      const wallet = new SmartAccount(ethnode.provider!, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.GOERLI, ChainId.GANACHE] // has to be consisttent providers and network names
        // walletProvider: ethnode.provider,
        //backend_url: "http://localhost:3000/v1"
      })

      const smartAccount = await wallet.init()

      if (eoaSigner) {
        const eoa = await eoaSigner.getAddress()
        expect(smartAccount.owner).to.be.equal(eoa)
      }

      const signer = await smartAccount.signer.getAddress()
      if (eoaSigner) {
        const relayer = new LocalRelayer(eoaSigner)
        const state = await smartAccount.getSmartAccountState(ChainId.GANACHE)
        const context = smartAccount.getSmartAccountContext(ChainId.GANACHE)
        const deployment = await relayer.deployWallet({ config: state, context, index: 0 })
        const receipt: TransactionReceipt = await deployment.wait(1)
        expect(receipt.status).to.be.equal(1)
      }
      const isDeployed = await smartAccount.isDeployed(ChainId.GANACHE) /// can pass chainId here
      expect(isDeployed).to.be.equal(true)

      const context = smartAccount.getSmartAccountContext(ChainId.GANACHE)
      expect(context.baseWallet).to.be.equal(smartAccount.smartAccount())
      expect(context.walletFactory).to.be.equal(smartAccount.factory())
      expect(context.multiSend).to.be.equal(smartAccount.multiSend())
      // todo chirag review
      // expect(context.multiSendCall).to.be.equal(smartAccount.multiSendCall())
    })

    it('Should be able to sign transaction', async () => {
      const userAddress = (await ethnode.signer?.getAddress()) || ''
      const eoaSigner = ethnode.provider?.getSigner()

      const wallet = new SmartAccount(ethnode.provider!, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.GOERLI, ChainId.GANACHE] // has to be consisttent providers and network names
      })

      const smartAccount = await wallet.init()

      const signerAddress = await smartAccount.signer.getAddress()

      const smartAccountAddress = smartAccount.address

      // Wallet would have been deployed already
      const isDeployed = await smartAccount.isDeployed(ChainId.GANACHE) /// can pass chainId here
      expect(isDeployed).to.be.equal(true)

      /*await ethnode.signer?.sendTransaction({
        from: signerAddress,
        to: smartAccountAddress,
        value: ethers.utils.parseEther("1"),
      });*/

      const tx: Transaction = {
        to: signerAddress,
        data: '0x',
        value: ethers.utils.parseEther('1')
      }

      const smartAccountTransaction: IWalletTransaction = await smartAccount.createTransaction({
        transaction: tx
      })

      const signature = await smartAccount.signTransaction({ version: smartAccount.DEFAULT_VERSION,  tx: smartAccountTransaction, chainId: ChainId.GANACHE, signer: smartAccount.signer })
      console.log('signature is: ', signature)
    })

    it('Should be able to switch active chain and return state', async () => {
      const userAddress = (await ethnode.signer?.getAddress()) || ''

      const eoaSigner = ethnode.provider?.getSigner()

      const wallet = new SmartAccount(ethnode.provider!, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.GOERLI, ChainId.GANACHE] // has to be consisttent providers and network names
      })

      const smartAccount = await wallet.init()

      if (eoaSigner) {
        const eoa = await eoaSigner.getAddress()
        expect(smartAccount.owner).to.be.equal(eoa)
      }

      console.log(smartAccount.factory().getAddress())

      const signer = await smartAccount.signer.getAddress()

      const address = await smartAccount.address
      console.log('counter factual wallet address: ', address)

      expect(address).to.be.equal(smartAccount.address)

      smartAccount.setActiveChain(ChainId.GOERLI)

      // todo : undo and fix
      // const isDeployed = await smartAccount.isDeployed(ChainId.GOERLI) /// can pass chainId here
      
      // Check if the smart wallet is deployed or not
      const state = await smartAccount.getSmartAccountState(ChainId.GOERLI)
      console.log(state)

      // todo : undo and fix
      // expect(isDeployed).to.be.equal(false)

      // todo : update
      // should be goerli entry point
      // expect(state.entryPointAddress).to.be.equal('0xF05217199F1C25604c67993F11a81461Bc97F3Ab')
    })

    it('Should be able to send transaction', async () => {
      const userAddress = (await ethnode.signer?.getAddress()) || ''
      const eoaSigner = ethnode.provider?.getSigner()

      const wallet = new SmartAccount(ethnode.provider!, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.GOERLI, ChainId.GANACHE] // has to be consisttent providers and network names
      })

      const smartAccount = await wallet.init()

      const signerAddress = await smartAccount.signer.getAddress()

      const smartAccountAddress = smartAccount.address

      // Wallet would have been deployed already
      const isDeployed = await smartAccount.isDeployed(ChainId.GANACHE) /// can pass chainId here
      expect(isDeployed).to.be.equal(true)

      console.log('balance before ', await ethnode.provider?.getBalance(smartAccountAddress))

      await ethnode.signer?.sendTransaction({
        from: signerAddress,
        to: smartAccountAddress,
        value: ethers.utils.parseEther('1')
      })

      console.log('balance after ', await ethnode.provider?.getBalance(smartAccountAddress))

      const tx: Transaction = {
        to: signerAddress,
        data: '0x',
        value: ethers.utils.parseEther('0.5')
      }

      const smartAccountTransaction: IWalletTransaction = await smartAccount.createTransaction({
        transaction: tx
      })

      // Attach relayer before sending a transaction

      const signer = await smartAccount.signer.getAddress()
      if (eoaSigner) {
        const relayer = new LocalRelayer(eoaSigner)
        smartAccount.setRelayer(relayer)
        expect(smartAccount.relayer).to.be.equal(relayer)
        const hash: string = await smartAccount.sendTransaction({ tx: smartAccountTransaction })

        //const receipt: TransactionReceipt = await response.wait(1)
        //expect(receipt.status).to.be.equal(1)
        console.log('balance after ', await ethnode.provider?.getBalance(smartAccountAddress))
        expect((await ethnode.provider?.getBalance(smartAccountAddress))?.toString()).to.be.equal(
          ethers.utils.parseEther('0.5').toString()
        )
      }
    })

    it('Should be able to send batch of transactions', async () => {
      const userAddress = (await ethnode.signer?.getAddress()) || ''
      const eoaSigner = ethnode.provider?.getSigner()

      const wallet = new SmartAccount(ethnode.provider!, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.GOERLI, ChainId.GANACHE] // has to be consisttent providers and network names
      })

      const smartAccount = await wallet.init()

      const signerAddress = await smartAccount.signer.getAddress()

      const smartAccountAddress = smartAccount.address

      // Wallet would have been deployed already
      const isDeployed = await smartAccount.isDeployed(ChainId.GANACHE) /// can pass chainId here
      expect(isDeployed).to.be.equal(true)

      console.log('balance before ', await ethnode.provider?.getBalance(smartAccountAddress))

      await ethnode.signer?.sendTransaction({
        from: signerAddress,
        to: smartAccountAddress,
        value: ethers.utils.parseEther('1')
      })

      console.log('balance after ', await ethnode.provider?.getBalance(smartAccountAddress))

      const txs: Transaction[] = []

      const tx1: Transaction = {
        to: signerAddress,
        data: '0x',
        value: ethers.utils.parseEther('0.5')
      }

      txs.push(tx1)

      console.log('receiver 1 ', signerAddress)
      console.log('receiver 2 ', await ethnode.provider?.getSigner(1).getAddress())

      const tx2: Transaction = {
        to: (await ethnode.provider?.getSigner(1).getAddress()) || signerAddress,
        data: '0x',
        value: ethers.utils.parseEther('0.5')
      }

      txs.push(tx2)

      const smartAccountTransaction: IWalletTransaction = await smartAccount.createTransactionBatch({
        transactions: txs
      })

      // Attach relayer before sending a transaction

      const signer = await smartAccount.signer.getAddress()
      if (eoaSigner) {
        const relayer = new LocalRelayer(eoaSigner)
        smartAccount.setRelayer(relayer)
        expect(smartAccount.relayer).to.be.equal(relayer)
        const txHash: string = await smartAccount.sendTransaction({ tx: smartAccountTransaction })

        // TODO : get receipt from hash using provider
        // const receipt: TransactionReceipt = await response.wait(1)
        // expect(receipt.status).to.be.equal(1)
        console.log('balance after ', await ethnode.provider?.getBalance(smartAccountAddress))
        expect((await ethnode.provider?.getBalance(smartAccountAddress))?.toString()).to.be.equal(
          ethers.utils.parseEther('0.5').toString()
        )
      }
    })

    // Next // TODO
    // Test cases for forward transaction mocking responses from rest relayer
    // createRefundTransaction (+Batch)
    // prepareDeployAndPayFees
    // deployAndPayFees
    // createRefundTransaction (+Batch)
    // estimateDeployments etc while mocking response form backend client
  })
})
