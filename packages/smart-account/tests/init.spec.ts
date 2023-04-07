import SmartAccount from '../src/SmartAccount'
import { ethers, Signer, Wallet } from 'ethers'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import hardhat from 'hardhat'
import { expect } from 'chai'
import { Environments } from '@biconomy-devx/core-types'

type EthereumInstance = {
  chainId?: number
  provider?: Web3Provider
  signer?: Signer
}

describe('SmartAccount unit tests', () => {
  const ethnode: EthereumInstance = {}
  let sdk: SmartAccount

  beforeEach(() => {
    ethnode.provider = new ethers.providers.Web3Provider(hardhat.network.provider.send)
    ethnode.signer = ethnode.provider?.getSigner()
    ethnode.chainId = 1337
  })

  describe('SmartAccount init test', () => {
    it('DEV: testnet init', async () => {
      const eoa = await ethnode.signer!.getAddress()
      const wallet = new SmartAccount(ethnode.signer!, {
        environment: Environments.DEV,
        activeNetworkId: 5,
        supportedNetworksIds: [5]
      })
      const smartAccount = await wallet.init()
      expect(smartAccount.owner).to.be.equal(eoa)
      expect(smartAccount.address).not.to.be.equal(eoa)
    })
    it('QA: testnet init', async () => {
      const eoa = await ethnode.signer!.getAddress()
      const wallet = new SmartAccount(ethnode.signer!, {
        environment: Environments.QA,
        activeNetworkId: 5,
        supportedNetworksIds: [5]
      })
      const smartAccount = await wallet.init()
      expect(smartAccount.owner).to.be.equal(eoa)
      expect(smartAccount.address).not.to.be.equal(eoa)
    })
    it('PROD: mainnet init', async () => {
      const eoa = await ethnode.signer!.getAddress()
      const wallet = new SmartAccount(ethnode.signer!, {
        environment: Environments.PROD,
        activeNetworkId: 5,
        supportedNetworksIds: [5]
      })
      // const smartAccount = await wallet.init()
      // expect(smartAccount.owner).to.be.equal(eoa)
      // expect(smartAccount.address).not.to.be.equal(eoa)
    })
  })

  describe('balance test', () => {
    it('should fetch smartAccount balance', async () => {
      const wallet = new SmartAccount(ethnode.signer!, {
        environment: Environments.QA,
        activeNetworkId: 5,
        supportedNetworksIds: [5]
      })
      const smartAccount = await wallet.init()
      const balanceParams = {
        chainId: 5,
        eoaAddress: smartAccount.owner,
        tokenAddresses: []
      }
      const balanceArr = await smartAccount.getAlltokenBalances(balanceParams)
      expect(balanceArr.data).to.be.an('array')

      const balanceTotal = await smartAccount.getTotalBalanceInUsd(balanceParams)
      expect(balanceTotal.data.totalBalance).to.be.equal(0)
    })
  })
})
