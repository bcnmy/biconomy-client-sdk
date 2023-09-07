import {
  EntryPoint,
  EntryPoint__factory,
  UserOperationStruct,
  SimpleAccountFactory__factory
} from '@account-abstraction/contracts'
import { Wallet } from 'ethers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
  SampleRecipient,
  SampleRecipient__factory
} from '@account-abstraction/utils/dist/src/types'

import {
  SmartAccount_v200,
  SmartAccountFactory_v200,
  SmartAccount_v200__factory,
  SmartAccountFactory_v200__factory,
  ECDSAOwnershipRegistryModule_v100__factory
} from '@biconomy/common'

import { BiconomySmartAccountV2 } from '../src/BiconomySmartAccountV2'
import { BiconomySmartAccount } from '../src/BiconomySmartAccount'
import { ChainId, UserOperation } from '@biconomy/core-types'
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSAOwnershipValidationModule } from '@biconomy/modules'

const provider = ethers.provider
const signer = provider.getSigner()

describe('BiconomySmartAccount API Specs', () => {
  let owner: Wallet
  let factoryOwner: Wallet
  let accountAPIV1: BiconomySmartAccount
  let accountAPI: BiconomySmartAccountV2
  let entryPoint: EntryPoint
  let beneficiary: string
  let recipient: SampleRecipient
  let accountAddress: string
  let accountDeployed = false

  before('init', async () => {
    owner = Wallet.createRandom()
    entryPoint = await new EntryPoint__factory(signer).deploy()
    console.log('ep address ', entryPoint.address)
    beneficiary = await signer.getAddress()
    factoryOwner = Wallet.createRandom()

    const accountImpl: SmartAccount_v200 = await new SmartAccount_v200__factory(signer).deploy(
      entryPoint.address
    )

    const accountFactory: SmartAccountFactory_v200 = await new SmartAccountFactory_v200__factory(
      signer
    ).deploy(accountImpl.address, await factoryOwner.getAddress())

    const ecdsaModule = await new ECDSAOwnershipRegistryModule_v100__factory(signer).deploy()

    const module = new ECDSAOwnershipValidationModule({
      signer: owner,
      moduleAddress: ecdsaModule.address
    })

    console.log('provider url ', provider.connection.url)

    recipient = await new SampleRecipient__factory(signer).deploy()
    accountAPI = new BiconomySmartAccountV2({
      chainId: ChainId.GANACHE,
      rpcUrl: 'http://127.0.0.1:8545',
      // paymaster: paymaster,
      // bundler: bundler,
      entryPointAddress: entryPoint.address,
      factoryAddress: accountFactory.address,
      defaultValidationModule: module,
      activeValidationModule: module
    })

    // console.log('account api provider ', accountAPI.provider)

    accountAPI = await accountAPI.init()

    console.log('Account address ', accountAPI.accountAddress)

    const counterFactualAddress = await accountAPI.getAccountAddress()
    console.log('Counterfactual address ', counterFactualAddress)
  })

  it('Nonce should be zero', async () => {
    const builtUserOp = await accountAPI.buildUserOp([
      { to: recipient.address, value: ethers.utils.parseEther('1'.toString()), data: '0x' }
    ])
    console.log('builtUserOp', builtUserOp)
    expect(builtUserOp?.nonce?.toString()).to.be.eq('0')
  })
  it('Sender should be non zero', async () => {
    const builtUserOp = await accountAPI.buildUserOp([
      { to: recipient.address, value: ethers.utils.parseEther('1'.toString()), data: '0x' }
    ])
    expect(builtUserOp.sender).to.be.not.equal(ethers.constants.AddressZero)
  })
  it('InitCode length should be greater then 170', async () => {
    const builtUserOp = await accountAPI.buildUserOp([
      { to: recipient.address, value: ethers.utils.parseEther('1'.toString()), data: '0x' }
    ])
    expect(builtUserOp?.initCode?.length).to.be.greaterThan(170)
  })
  it('#getUserOpHash should match entryPoint.getUserOpHash', async function () {
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
    const hash = await accountAPI.getUserOpHash(userOp)
    const epHash = await entryPoint.getUserOpHash(userOp)
    expect(hash).to.equal(epHash)
  })
  it('should deploy to counterfactual address', async () => {
    accountAddress = await accountAPI.getAccountAddress()
    expect(await provider.getCode(accountAddress).then((code) => code.length)).to.equal(2)

    await signer.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther('0.1')
    })
    const op = await accountAPI.buildUserOp([
      {
        to: recipient.address,
        data: recipient.interface.encodeFunctionData('something', ['hello'])
      }
    ])

    const signedUserOp = await accountAPI.signUserOp(op)

    await expect(entryPoint.handleOps([signedUserOp], beneficiary)).to.emit(recipient, 'Sender')

    expect(await provider.getCode(accountAddress).then((code) => code.length)).to.greaterThan(0)

    accountDeployed = true
  })

  // <<TODO>>
  // possibly use local bundler API from image
  it('should build and send userop via bundler API', async () => {})

  // <<TODO>>
  // 1. other getter and setters
  // 2. sendSignedUserOp()
  // 3. sendUserOp()
  // 4. getUserOpHash()
  // 5. signUserOp() // using different validation modules
  // 6. sending userOps using a paymaster
  // 7. sending userOps using different active validation modules
  // 8. deploying account using different default validation modules
})
