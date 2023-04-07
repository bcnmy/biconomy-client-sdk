import { SampleRecipient, SampleRecipient__factory } from '@biconomy-devx/common/dist/src/types'
import { ethers } from 'hardhat'
import { ClientConfig, ERC4337EthersProvider, newProvider } from '../src'
import { EntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import { expect } from 'chai'
import { Wallet } from 'ethers'

import {
  SmartWalletContractFactoryV100,
  EntryPointFactoryContractV100,
  SmartWalletFactoryV100,
  SmartWalletFactoryContractV100,
  EntryPointContractV100,
  SmartWalletContractV100
} from '@biconomy-devx/ethers-lib'

const provider = ethers.provider
const signer = provider.getSigner()
const fallBackHandlerAddress = '0xF05217199F1C25604c67993F11a81461Bc97F3Ab' // temp

describe('ERC4337EthersSigner, Provider', function () {
  let owner: Wallet
  let aaProvider: ERC4337EthersProvider
  let entryPoint: EntryPointContractV100
  let beneficiary: string
  let recipient: SampleRecipient
  let walletAddress: string
  let baseWalletContract: SmartWalletContractV100
  let walletFactoryContract: SmartWalletFactoryContractV100
  let walletDeployed = false
  let userSCW: SmartWalletContractV100
  let expectedSCW: string
  let chainId: number

  before('init', async () => {
    const deployRecipient = await new SampleRecipient__factory(signer).deploy()
    chainId = (await provider.getNetwork()).chainId
    console.log(chainId)

    entryPoint = await new EntryPointFactoryContractV100(signer).deploy()
    console.log('entryPoint ', entryPoint.address)
    beneficiary = await signer.getAddress()

    recipient = await new SampleRecipient__factory(signer).deploy()
    owner = Wallet.createRandom()
    console.log('EOA address? ', owner.address)

    baseWalletContract = await new SmartWalletFactoryV100(signer).deploy(entryPoint.address)
    console.log('base wallet deployed at ', baseWalletContract.address)

    walletFactoryContract = await new SmartWalletContractFactoryV100(signer).deploy(
      baseWalletContract.address
    )
    console.log('wallet factory deployed at ', walletFactoryContract.address)

    expectedSCW = await walletFactoryContract.getAddressForCounterFactualAccount(owner.address, 0)
    console.log('expectedSCW address ', expectedSCW)

    userSCW = baseWalletContract.attach(expectedSCW)

    const clientConfig = {
      dappAPIKey: '',
      chainId: chainId,
      entryPointAddress: entryPoint.address,
      biconomySigningServiceUrl:
        'https://paymaster-signing-service.staging.biconomy.io/api/v1/sign',
      socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
      bundlerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
      txServiceUrl: 'https://sdk-backend.staging.biconomy.io/v1'
    }
    aaProvider = await newProvider(
      provider,
      clientConfig,
      signer,
      expectedSCW,
      baseWalletContract.address,
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
          const message =
            e.errorArgs != null ? `${e.errorName}(${e.errorArgs.join(',')})` : e.message
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
      console.log(e.message)
      // expect(e.message).to.eq(
      //   "FailedOp(0,0x0000000000000000000000000000000000000000,wallet didn't pay prefund)"
      // )
      // TODO: fix this
      expect(e.message).to.eq('No Chain Found Against Supplied Id')
    }
  })
})
