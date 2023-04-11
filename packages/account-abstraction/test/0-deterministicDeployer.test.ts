import { expect } from 'chai'
import { SmartWalletFactoryV100 } from '@biconomy-devx/ethers-lib'
import hardhat from 'hardhat'
import { hexValue } from 'ethers/lib/utils'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

import { ethers, Signer as AbstractSigner } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

const deployer = DeterministicDeployer.instance

type EthereumInstance = {
  chainId?: number
  provider?: Web3Provider
  signer?: AbstractSigner
}

describe('#deterministicDeployer', () => {
  const ethnode: EthereumInstance = {}

  before(async () => {
    // Provider from hardhat without a server instance
    ethnode.provider = new ethers.providers.Web3Provider(hardhat.network.provider.send)
    ethnode.signer = ethnode.provider?.getSigner()
    ethnode.chainId = 1337
  })

  it('deploy deployer', async () => {
    expect(await deployer.isDeployerDeployed()).to.equal(false)
    await deployer.deployDeployer()
    expect(await deployer.isDeployerDeployed()).to.equal(true)
  })
  it('should ignore deploy again of deployer', async () => {
    await deployer.deployDeployer()
  })
  it('should deploy at given address', async () => {
    const baseWallet = '0x548c6B8acf4f1396E915ffdC521F37D152DFB5A4'
    const ctr = hexValue(new SmartWalletFactoryV100().getDeployTransaction(baseWallet).data!)
    const addr = await DeterministicDeployer.getAddress(ctr)
    expect(await deployer.isContractDeployed(addr)).to.equal(false)
    await DeterministicDeployer.deploy(ctr)
    expect(await deployer.isContractDeployed(addr)).to.equal(true)
  })
})
