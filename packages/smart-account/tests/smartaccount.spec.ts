import SmartAccount from '../src/SmartAccount';
import { LocalRelayer } from '@biconomy-sdk/relayer'
import { Contract, ethers, Signer as AbstractSigner } from 'ethers'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';

import chaiAsPromised from 'chai-as-promised'
import * as chai from 'chai'
const nock = require('nock')

const { expect } = chai.use(chaiAsPromised)

import hardhat from "hardhat";
import { deployWalletContracts } from './utils/deploy';
import { BytesLike, Interface } from 'ethers/lib/utils'

type EthereumInstance = {
  chainId?: number,
  provider?: Web3Provider,
  signer?: AbstractSigner
};

// import hardhat from 'hardhat'
// import { BytesLike, Interface } from 'ethers/lib/utils'

describe('Wallet integration', function () {
  const ethnode: EthereumInstance = {}
  let relayer: LocalRelayer
  let smartAccount: SmartAccount

  before(async () => {
    // Provider from hardhat without a server instance
    ethnode.provider = new ethers.providers.Web3Provider(hardhat.network.provider.send);
    ethnode.signer = ethnode.provider.getSigner()
    ethnode.chainId = 1337

  })

  beforeEach(async () => {
  })

  after(async () => {
  })

  describe('Smart account usage and basic actions', () => {

    beforeEach(async () => {
    })

    it('Should init and return details of smart account', async () => {

      enum ChainId {
        // Ethereum
        MAINNET = 1,
        ROPSTEN = 3,
        RINKEBY = 4,
        GOERLI = 5,
        KOVAN = 42,
        MUMBAI = 80001,
        GANACHE = 1337
      }

      const userAddress = await ethnode.signer?.getAddress() || '';

      const eoaSigner = ethnode.provider?.getSigner()

      if (eoaSigner) {
        const eoa = await eoaSigner.getAddress();
        console.log('eoa ', eoa);
      }

      // adds entry point, multiSendCall and fallbackHandler
      const [ smartWallet, walletFactory, multiSend ] = await deployWalletContracts(ethnode.signer);

      console.log('base wallet deployed at : ', smartWallet.address);
      console.log('wallet factory deployed at : ', walletFactory.address);
      console.log('multi send deployed at : ', multiSend.address);


      const scope = nock('http://localhost:3000')
      .persist()
      .get('/v1/chains/')
      .reply(200, {
        "message": "Success",
        "code": 200,
        "data": [
            {
                "chainId": 4,
                "name": "Rinkeby",
                "symbol": "ETH",
                "isL2": false,
                "isMainnet": false,
                "description": "",
                "blockExplorerUriTemplate": {
                    "address": "https://rinkeby.etherscan.io/address/",
                    "txHash": "https://rinkeby.etherscan.io/address/",
                    "api": "https://rinkeby.etherscan.io/"
                },
                "ensRegistryAddress": "",
                "walletFactoryAddress": "0x7146D756D1a95D9916f358b391f029eE0925F9bb",
                "walletCreatedCallBackEndpoint": "https://localhost:3000/smart-wallet/",
                "walletCreatedEventHit": false,
                "EoaChangedCallBackEndpoint": "https://localhost:3000/smart-wallet/owner",
                "EoaChangedEventHit": false,
                "walletAddress": "0x24A156B6eBcAc4fa02Aa7dEFF10B3b9f8FE43284",
                "entryPoint": "0xB63F450BbCeaf7D9DdBD35BF52DE1F674DD83e45",
                "fallBackHandler": "0x57F2aF40aDF62CA1972224625f105852D2cdB4D1",
                "relayerUrl": "",
                "providerUrl": "https://rinkeby.infura.io/v3/d126f392798444609246423b06116c77",
                "indexerUrl": "",
                "backendNodeUrl": "",
                "token": {
                    "name": "Ethereum",
                    "symbol": "ETH",
                    "chainId": 4,
                    "ercType": "NATIVE",
                    "decimals": 18,
                    "logoUri": "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
                    "address": "null",
                    "isNativeToken": true,
                    "isEnabled": true
                }
            },
            {
                "chainId": 5,
                "name": "Goerli",
                "symbol": "ETH",
                "isL2": false,
                "isMainnet": false,
                "description": "",
                "blockExplorerUriTemplate": {
                    "address": "https://goerli.etherscan.io/address/",
                    "txHash": "https://goerli.etherscan.io/address/",
                    "api": "https://goerli.etherscan.io/"
                },
                "ensRegistryAddress": "",
                "walletFactoryAddress": "0x7146D756D1a95D9916f358b391f029eE0925F9bb",
                "walletCreatedCallBackEndpoint": "https://localhost:3000/smart-wallet/",
                "walletCreatedEventHit": false,
                "EoaChangedCallBackEndpoint": "https://localhost:3000/smart-wallet/owner",
                "EoaChangedEventHit": false,
                "walletAddress": "0x4A3334BA2b9Ff7c2b8bc270bC2b8a4B8e366839e",
                "entryPoint": "0xDc7d491D694CB44d0Da0400E05F9650c5e0FB11d",
                "fallBackHandler": "0xa9939Cb3Ed4efaeA050f75A23fD8709cBE6181e4",
                "relayerUrl": "",
                "providerUrl": "https://eth-goerli.g.alchemy.com/v2/477qAVdmEssSZbEPaUMTZXqyetQx5fxg",
                "indexerUrl": "",
                "backendNodeUrl": ""
            },
            {
                "chainId": 80001,
                "name": "Polygon Mumbai",
                "symbol": "MATIC",
                "isL2": true,
                "isMainnet": false,
                "description": "",
                "blockExplorerUriTemplate": {
                    "address": "https://mumbai.polygonscan.com/address/",
                    "txHash": "https://mumbai.polygonscan.com/address/",
                    "api": "https://api.mumbai.polygonscan.com/"
                },
                "ensRegistryAddress": "",
                "walletFactoryAddress": "0x7146D756D1a95D9916f358b391f029eE0925F9bb",
                "walletCreatedCallBackEndpoint": "https://localhost:3000/smart-wallet/",
                "walletCreatedEventHit": false,
                "EoaChangedCallBackEndpoint": "https://localhost:3000/smart-wallet/owner",
                "EoaChangedEventHit": false,
                "walletAddress": "0x4A3334BA2b9Ff7c2b8bc270bC2b8a4B8e366839e",
                "entryPoint": "0xDc7d491D694CB44d0Da0400E05F9650c5e0FB11d",
                "fallBackHandler": "0xa9939Cb3Ed4efaeA050f75A23fD8709cBE6181e4",
                "relayerUrl": "",
                "providerUrl": "https://polygon-mumbai.g.alchemy.com/v2/7JwWhWSG1vtw6ggm_o_GcYnyNw02oM8b",
                "indexerUrl": "",
                "backendNodeUrl": ""
            },
            {
                "chainId": 1337,
                "name": "Hardhat2",
                "symbol": "ETH",
                "isL2": true,
                "isMainnet": false,
                "description": "",
                "blockExplorerUriTemplate": {
                    "address": "https://mumbai.polygonscan.com/address/",
                    "txHash": "https://mumbai.polygonscan.com/address/",
                    "api": "https://api.mumbai.polygonscan.com/"
                },
                "ensRegistryAddress": "",
                "walletFactoryAddress": walletFactory.address,
                "walletCreatedCallBackEndpoint": "https://localhost:3000/smart-wallet/",
                "walletCreatedEventHit": false,
                "EoaChangedCallBackEndpoint": "https://localhost:3000/smart-wallet/owner",
                "EoaChangedEventHit": false,
                "walletAddress": smartWallet.address,
                "entryPoint": "0xDc7d491D694CB44d0Da0400E05F9650c5e0FB11d",
                "fallBackHandler": "0xa9939Cb3Ed4efaeA050f75A23fD8709cBE6181e4",
                "relayerUrl": "",
                "providerUrl": "http://localhost:8545",
                "indexerUrl": "",
                "backendNodeUrl": ""
            }
        ]
    })

      const wallet = new SmartAccount(ethnode.provider, {
        activeNetworkId: ChainId.GANACHE,
        supportedNetworksIds: [ChainId.RINKEBY, ChainId.GANACHE], // has to be consisttent providers and network names
        // walletProvider: ethnode.provider,
        //backend_url: "http://localhost:3000/v1"
      });

      // There must be a way to set wallet context before we go with init and deploy + txn tests

      // I'd have to deploy the contracts and set specs
      const smartAccount = await wallet.init();
      console.log(wallet.owner);

      console.log(smartAccount.factory().getAddress());

      const signer = await smartAccount.ethersAdapter().getSignerAddress();

      const address = await smartAccount.getAddress();
      console.log('counter factual wallet address: ', address);

      const isDeployed = await smartAccount.isDeployed(); /// can pass chainId here
      // Check if the smart wallet is deployed or not
      const state = await smartAccount.getSmartAccountState();
      console.log('wallet state');
      console.log(state);
      expect(isDeployed).to.be.equal(false)
    })
  })
})

