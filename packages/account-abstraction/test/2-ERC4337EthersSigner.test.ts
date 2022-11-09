import { SampleRecipient, SampleRecipient__factory } from '@biconomy-sdk/common/dist/src/types'
import { ethers } from 'hardhat'
import { ClientConfig, ERC4337EthersProvider, newProvider } from '../src'
import { EntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { Wallet } from 'ethers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'

import {
  SmartWalletFactoryFactoryContractV101,
  EntryPointFactoryContractV101,
  SmartWalletFactoryV101,
  SmartWalletFactoryContractV101,
  EntryPointContractV101,
  SmartWalletContractV101
} from '@biconomy-sdk/ethers-lib'

const provider = ethers.provider
const signer = provider.getSigner()
const originalSigner = provider.getSigner(1)
const fallBackHandlerAddress = '0xF05217199F1C25604c67993F11a81461Bc97F3Ab' // temp

describe('ERC4337EthersSigner, Provider', function () {
  let recipient: SampleRecipient
  let aaProvider: ERC4337EthersProvider
  let entryPoint: EntryPoint
  let walletAddress: string
  let baseWalletContract: SmartWalletContractV101
  let walletFactoryContract: SmartWalletFactoryContractV101
  const walletDeployed = false
  let userSCW: SmartWalletContractV101
  let expected: string
  let beneficiary: string
  let chainId: number
  before('init', async () => {
    const deployRecipient = await new SampleRecipient__factory(signer).deploy()
    entryPoint = await new EntryPoint__factory(signer).deploy(1, 1)

    entryPoint = await new EntryPointFactoryContractV101(signer).deploy(1, 1)
    console.log('entryPoint ', entryPoint.address)
    beneficiary = await signer.getAddress()

    const owner = Wallet.createRandom()

    recipient = await new SampleRecipient__factory(signer).deploy()
    console.log('EOA address? ', owner.address)

    baseWalletContract = await new SmartWalletFactoryV101(signer).deploy()
    console.log('base wallet deployed at ', baseWalletContract.address)

    walletFactoryContract = await new SmartWalletFactoryFactoryContractV101(signer).deploy(
      baseWalletContract.address
    )
    console.log('wallet factory deployed at ', walletFactoryContract.address)

    expected = await walletFactoryContract.getAddressForCounterfactualWallet(owner.address, 0)
    console.log('expected address ', expected)

    const clientConfig: ClientConfig = {
      dappAPIKey: 'PMO3rOHIu.5eabcc5d-df35-4d37-93ff-502d6ce7a5d6',
      biconomySigningServiceUrl: 'https://us-central1-biconomy-staging.cloudfunctions.net',
      socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
      entryPointAddress: entryPoint.address,
      bundlerUrl: 'http://localhost:3000/rpc',
      chainId: await provider.getNetwork().then((net) => net.chainId)
    }

    aaProvider = await newProvider(
      provider,
      clientConfig,
      owner,
      expected,
      fallBackHandlerAddress,
      walletFactoryContract.address
    )

    // for testing: bypass sending through a bundler, and send directly to our entrypoint..
    aaProvider.httpRpcClient.sendUserOpToBundler = async (userOp) => {
      try {
        await entryPoint.handleOps([userOp], beneficiary)
      } catch (e: any) {
        // doesn't report error unless called with callStatic
        await entryPoint.callStatic.handleOps([userOp], beneficiary).catch((e: any) => {
          // eslint-disable-next-line
                    const message = e.errorArgs != null ? `${e.errorName}(${e.errorArgs.join(',')})` : e.message
          throw new Error(message)
        })
      }
    }
    recipient = deployRecipient.connect(aaProvider.getSigner())
  })

  it('should fail to send before funding', async () => {
    try {
      await recipient.something('hello', { gasLimit: 1e6 })
      throw new Error('should revert')
    } catch (e: any) {
      expect(e.message).to.eq(
        "FailedOp(0,0x0000000000000000000000000000000000000000,wallet didn't pay prefund)"
      )
    }
  })

  it('should use ERC-4337 Signer and Provider to send the UserOperation to the bundler', async function () {
    const walletAddress = await aaProvider.getSigner().getAddress()
    await signer.sendTransaction({
      to: walletAddress,
      value: parseEther('0.1')
    })

    expect(await recipient.something('hello'))
      .to.emit(recipient, 'Sender')
      .withArgs(anyValue, walletAddress, 'hello')
  })

  it('should revert if on-chain userOp execution reverts', async function () {
    try {
      await recipient.reverting({ gasLimit: 10000 })
    } catch (e: any) {
      expect(e.message).to.match(/test revert/)
    }
  })
})
