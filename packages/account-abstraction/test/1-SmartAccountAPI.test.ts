import {
  EntryPoint,
  EntryPoint__factory,
  SimpleWalletDeployer__factory,
  UserOperationStruct
} from '@account-abstraction/contracts'
import { Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { ethers } from 'hardhat'
import { UserOperation } from '@biconomy-sdk/core-types'
import { SmartAccountAPI } from '../src'
import { SampleRecipient, SampleRecipient__factory } from '@biconomy-sdk/common/dist/src/types'

import {
  SmartWalletFactoryFactoryContractV101,
  EntryPointFactoryContractV101,
  SmartWalletFactoryV101,
  SmartWalletFactoryContractV101,
  EntryPointContractV101,
  SmartWalletContractV101
} from '@biconomy-sdk/ethers-lib'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

const provider = ethers.provider
const signer = provider.getSigner()
const originalSigner = provider.getSigner(1)
const fallBackHandlerAddress = '0xF05217199F1C25604c67993F11a81461Bc97F3Ab' // temp

describe('SmartAccountAPI', async () => {
  let owner: Wallet
  let api: SmartAccountAPI
  let entryPoint: EntryPointContractV101
  let beneficiary: string
  let recipient: SampleRecipient
  let walletAddress: string
  let baseWalletContract: SmartWalletContractV101
  let walletFactoryContract: SmartWalletFactoryContractV101
  let walletDeployed = false
  let userSCW: SmartWalletContractV101
  let expected: string
  let chainId: number

  before('init', async () => {
    chainId = (await provider.getNetwork()).chainId
    console.log(chainId)

    entryPoint = await new EntryPointFactoryContractV101(signer).deploy(1, 1)
    console.log('entryPoint ', entryPoint.address)
    beneficiary = await signer.getAddress()

    recipient = await new SampleRecipient__factory(signer).deploy()
    owner = Wallet.createRandom()
    console.log('EOA address? ', owner.address)

    baseWalletContract = await new SmartWalletFactoryV101(signer).deploy()
    console.log('base wallet deployed at ', baseWalletContract.address)

    walletFactoryContract = await new SmartWalletFactoryFactoryContractV101(signer).deploy(
      baseWalletContract.address
    )
    console.log('wallet factory deployed at ', walletFactoryContract.address)

    expected = await walletFactoryContract.getAddressForCounterfactualWallet(owner.address, 0)
    console.log('expected address ', expected)

    // deploy wallet
    // const proxy = await walletFactoryContract.deployCounterFactualWallet(owner.address, entryPoint.address, fallBackHandlerAddress, 0);
    // console.log('proxy ', proxy)

    userSCW = baseWalletContract.attach(expected)

    // const factoryAddress = await DeterministicDeployer.deploy(SimpleWalletDeployer__factory.bytecode)
    const clientConfig = {
      dappAPIKey: 'PMO3rOHIu.5eabcc5d-df35-4d37-93ff-502d6ce7a5d6',
      biconomySigningServiceUrl: 'https://us-central1-biconomy-staging.cloudfunctions.net',
      socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
      entryPointAddress: entryPoint.address,
      bundlerUrl: 'http://localhost:3000/rpc',
      chainId: chainId
    }

    api = new SmartAccountAPI(
      provider, // can do json rpc provider
      entryPoint,
      clientConfig,
      expected,
      owner,
      fallBackHandlerAddress,
      walletFactoryContract.address,
      0
    )

    console.log('smart account api')
    console.log(api.walletAddress)
  })

  it('#getRequestId should match entryPoint.getRequestId', async function () {
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
    const hash = await api.getRequestId(userOp)
    const epHash = await entryPoint.getRequestId(userOp)
    expect(hash).to.equal(epHash)
  })

  it('should deploy to counterfactual address', async () => {
    walletAddress = await api.getWalletAddress()
    console.log('wallet address from api ', walletAddress)
    expect(await provider.getCode(walletAddress).then((code) => code.length)).to.equal(2)

    await signer.sendTransaction({
      to: walletAddress,
      value: parseEther('0.1')
    })
    console.log('sent eth')

    let op: any
    try {
      op = await api.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello'])
      })
    } catch (err) {
      console.log('error here')
      console.log(err)
    }

    await expect(entryPoint.handleOps([op], beneficiary))
      .to.emit(recipient, 'Sender')
      .withArgs(anyValue, walletAddress, 'hello')

    //expect(await provider.getCode(walletAddress).then(code => code.length)).to.greaterThan(1000)
    walletDeployed = true
  })

  it('should use wallet API after creation without a factory', async function () {
    if (!walletDeployed) {
      this.skip()
    }
    // TODO : Update with prod values
    const clientConfig = {
      dappAPIKey: 'PMO3rOHIu.5eabcc5d-df35-4d37-93ff-502d6ce7a5d6',
      biconomySigningServiceUrl: 'https://us-central1-biconomy-staging.cloudfunctions.net',
      socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
      entryPointAddress: entryPoint.address,
      bundlerUrl: 'http://localhost:3000/rpc',
      chainId: chainId
    }

    const api1 = new SmartAccountAPI(
      provider, // can do json rpc provider
      entryPoint,
      clientConfig,
      expected,
      owner,
      fallBackHandlerAddress,
      walletFactoryContract.address,
      0
    )

    const op1 = await api1.createSignedUserOp({
      target: recipient.address,
      data: recipient.interface.encodeFunctionData('something', ['world'])
    })
    await expect(entryPoint.handleOps([op1], beneficiary))
      .to.emit(recipient, 'Sender')
      .withArgs(anyValue, walletAddress, 'world')
  })
})
