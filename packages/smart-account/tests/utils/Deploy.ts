import { Contract, ethers } from 'ethers'

// import { SmartWalletContract } from '@biconomy-devx/core-types'
const EntryPointArtifact = require('../../../ethers-lib/artifacts/contracts/V1.0.0.sol/EntryPointContract_v1_0_0.json')
const SmartWalletArtifact = require('../../../ethers-lib/artifacts/contracts/V1.0.0.sol/SmartWalletContract_v1_0_0.json')
const WalletFactoryArtifact = require('../../../ethers-lib/artifacts/contracts/V1.0.0.sol/SmartWalletFactoryContract_v1_0_0.json')
const MultiSendArtifact = require('../../../ethers-lib/artifacts/contracts/V1.0.0.sol/MultiSendContract_v1_0_0.json')
const MultiSendCallOnlyArtifact = require('../../../ethers-lib/artifacts/contracts/V1.0.0.sol/MultiSendCallOnlyContract_v1_0_0.json')

export async function deployWalletContracts(
  signer: ethers.Signer
): Promise<[Contract, Contract, Contract, Contract, Contract]> {
  // could get these from type chain

  const entryPoint = (await new ethers.ContractFactory(
    EntryPointArtifact.abi,
    EntryPointArtifact.bytecode,
    signer
  ).deploy()) as unknown as Contract

  const smartWallet = (await new ethers.ContractFactory(
    SmartWalletArtifact.abi,
    SmartWalletArtifact.bytecode,
    signer
  ).deploy(entryPoint.address)) as unknown as Contract

  const walletFactory = (await new ethers.ContractFactory(
    WalletFactoryArtifact.abi,
    WalletFactoryArtifact.bytecode,
    signer
  ).deploy(smartWallet.address)) as unknown as Contract

  const multiSend = (await new ethers.ContractFactory(
    MultiSendArtifact.abi,
    MultiSendArtifact.bytecode,
    signer
  ).deploy()) as unknown as Contract

  const multiSendCallOnly = (await new ethers.ContractFactory(
    MultiSendCallOnlyArtifact.abi,
    MultiSendCallOnlyArtifact.bytecode,
    signer
  ).deploy()) as unknown as Contract

  return [smartWallet, walletFactory, multiSend, multiSendCallOnly, entryPoint]
}
