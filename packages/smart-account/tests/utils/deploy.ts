import { Contract, ethers } from 'ethers'

// import { SmartWalletContract } from '@biconomy-sdk/core-types'
const SmartWalletArtifact = require('@biconomy-sdk/ethers-lib/artifacts/scw-contracts/smart-contract-wallet/Smartwallet.sol/SmartWallet.json')
const WalletFactoryArtifact = require('@biconomy-sdk/ethers-lib/artifacts/scw-contracts/smart-contract-wallet/WalletFactory.sol/WalletFactory.json')
const MultiSendArtifact = require('@biconomy-sdk/ethers-lib/artifacts/scw-contracts/smart-contract-wallet/libs/MultiSend.sol/MultiSend.json')
const MultiSendCallOnlyArtifact = require('@biconomy-sdk/ethers-lib/artifacts/scw-contracts/smart-contract-wallet/libs/MultiSendCallOnly.sol/MultiSendCallOnly.json')

export async function deployWalletContracts(
  signer: ethers.Signer
): Promise<[Contract, Contract, Contract, Contract]> {
  // could get these from type chain

  const smartWallet = (await new ethers.ContractFactory(
    SmartWalletArtifact.abi,
    SmartWalletArtifact.bytecode,
    signer
  ).deploy()) as unknown as Contract

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

  return [smartWallet, walletFactory, multiSend, multiSendCallOnly]
}
