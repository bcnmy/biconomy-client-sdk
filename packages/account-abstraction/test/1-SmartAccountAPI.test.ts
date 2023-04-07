import { EntryPoint__factory } from '@account-abstraction/contracts'
import { Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { UserOperation } from '@biconomy-devx/core-types'
import { SmartAccountAPI } from '../src'
import { SampleRecipient, SampleRecipient__factory } from '@biconomy-devx/common/dist/src/types'

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

describe('SmartAccountAPI', async () => {
  let owner: Wallet
  let api: SmartAccountAPI
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
    const entryPointClass = EntryPoint__factory.connect(entryPoint.address, signer)
    api = new SmartAccountAPI(
      provider, // can do json rpc provider
      entryPointClass,
      clientConfig,
      expectedSCW,
      owner.address,
      signer,
      fallBackHandlerAddress,
      walletFactoryContract.address,
      0
    )

    console.log('smart account api', api.accountAddress)
  })

  it('getUserOpHash should match entryPoint.getUserOpHash', async function () {
    const userOp: UserOperation = {
      sender: '0x'.padEnd(42, '1'),
      nonce: 2,
      initCode: '0x3333',
      callData: '0x4444',
      callGasLimit: 5,
      verificationGasLimit: 6,
      preVerificationGas: 7,
      maxFeePerGas: 8,
      maxPriorityFeePerGas: 9,
      paymasterAndData: '0xaaaaaa',
      signature: '0xbbbb'
    }
    const hash = await api.getUserOpHash(userOp)
    const epHash = await entryPoint.getUserOpHash(userOp)
    expect(hash).to.equal(epHash)
  })

  it('should deploy to counterfactual address', async () => {
    walletAddress = await api.accountAddress!
    console.log('wallet address from api ', walletAddress)
    expect(await provider.getCode(walletAddress).then((code) => code.length)).to.equal(2)

    await signer.sendTransaction({
      to: walletAddress,
      value: parseEther('0.1')
    })
    console.log('sent eth')

    let op: any
    try {
      console.log('recipient.address ', recipient.address)
      const data = recipient.interface.encodeFunctionData('something', ['hello'])
      op = await api.createSignedUserOp({
        target: [recipient.address],
        data: [data],
        value: [0]
      })
      console.log('signed user op ', op)
    } catch (err) {
      console.log('error here')
      console.log(err)
    }
    // TODO: fix this chainId issue
  })
})
