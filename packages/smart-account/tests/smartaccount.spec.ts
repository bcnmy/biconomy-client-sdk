import SmartAccount from '../src/SmartAccount'
import { LocalRelayer } from '@biconomy-sdk/relayer'
// import { Contract, ethers, Signer as AbstractSigner } from 'ethers'
import { Contract, ethers, Signer as AbstractSigner } from 'ethers'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'

import chaiAsPromised from 'chai-as-promised'
import * as chai from 'chai'

const Web3 = require('web3')
const { expect } = chai.use(chaiAsPromised)

import hardhat from 'hardhat'
import { deployWalletContracts } from './utils/deploy'
import { BytesLike, Interface } from 'ethers/lib/utils'

type EthereumInstance = {
  chainId?: number
  provider?: Web3Provider
  signer?: AbstractSigner
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

    ethnode.signer = ethnode.provider.getSigner()
    ethnode.chainId = 31338
  })

  beforeEach(async () => {})

  after(async () => {})

  describe('Smart account usage and basic actions', () => {
    beforeEach(async () => {})

    it('Should init and return details of smart account', async () => {
      enum ChainId {
        // Ethereum
        MAINNET = 1,
        ROPSTEN = 3,
        RINKEBY = 4,
        GOERLI = 5,
        KOVAN = 42,
        MUMBAI = 80001,
        HARDHAT = 31338
      }

      const userAddress = (await ethnode.signer?.getAddress()) || ''

      const eoaSigner = ethnode.provider?.getSigner()

      if (eoaSigner) {
        const eoa = await eoaSigner.getAddress()
        console.log('eoa ', eoa)
      }

      const wallet = new SmartAccount(ethnode.provider, {
        activeNetworkId: ChainId.RINKEBY,
        supportedNetworksIds: [ChainId.RINKEBY] // has to be consisttent providers and network names
        // walletProvider: ethnode.provider,
        //backend_url: "http://localhost:3000/v1"
      })

      // adds entry point, multiSendCall and fallbackHandler
      // const [ smartWallet, walletFactory, multiSend ] = await deployWalletContracts(ethnode.signer);

      /*console.log('base wallet deployed at : ', smartWallet.address);
      console.log('wallet factory deployed at : ', walletFactory.address);
      console.log('multi send deployed at : ', multiSend.address);*/

      // There must be a way to set wallet context before we go with init and deploy + txn tests

      // I'd have to deploy the contracts and set specs
      const smartAccount = await wallet.init()
      console.log(wallet.owner)

      console.log(smartAccount.smartAccount(ChainId.RINKEBY).getAddress())
      console.log(smartAccount.factory(ChainId.RINKEBY).getAddress())

      const signer = await smartAccount.ethersAdapter().getSignerAddress()

      const address = await smartAccount.getAddress()
      console.log('counter factual wallet address: ', address)

      const isDeployed = await smartAccount.isDeployed() /// can pass chainId here
      // Check if the smart wallet is deployed or not
      const state = await smartAccount.getSmartAccountState()
      console.log('wallet state')
      console.log(state)
      expect(isDeployed).to.be.equal(false)
    })
  })
})
