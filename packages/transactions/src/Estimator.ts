import { ethers } from 'ethers'
import { GasEstimator } from './assets'
import NodeClient, { EstimateUndeployedContractGasDto } from '@biconomy-devx/node-client'
import ContractUtils from './ContractUtils'
import {
  EstimateSmartAccountDeploymentDto,
  IWalletTransaction,
  FAKE_SIGNATURE,
  ExecTransaction,
  IFeeRefundV1_0_1,
  SmartAccountState
} from '@biconomy-devx/core-types'
import { Logger } from '@biconomy-devx/common'
import { GetFeeQuotesForBatchDto, GetFeeQuotesDto } from './Types'

export class Estimator {
  nodeClient!: NodeClient

  contractUtils!: ContractUtils

  // Note: Smart account state should Not be part of constructor
  constructor(nodeClient: NodeClient, contractUtils: ContractUtils) {
    this.nodeClient = nodeClient
    this.contractUtils = contractUtils
  }

  async estimateTransaction(
    prepareTransactionDto: GetFeeQuotesDto,
    createdTransaction: IWalletTransaction,
    smartAccountState: SmartAccountState
  ): Promise<number> {
    const { chainId, version } = prepareTransactionDto
    let estimatedGasUsed = 0
    // Check if available from current state
    const isDeployed = await this.contractUtils.isDeployed(
      chainId,
      smartAccountState.address // SmartAccountState
    )
    if (!isDeployed) {
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId,
        version,
        owner: smartAccountState.owner
      })
      Logger.log('estimateWalletDeployment ', estimateWalletDeployment)

      estimatedGasUsed += estimateWalletDeployment
    }

    const txn: ExecTransaction = {
      to: createdTransaction.to,
      value: createdTransaction.value,
      data: createdTransaction.data,
      operation: createdTransaction.operation,
      targetTxGas: createdTransaction.targetTxGas
    }

    // to avoid failing eth_call override with undeployed wallet
    txn.targetTxGas = 500000

    const refundInfo: IFeeRefundV1_0_1 = {
      baseGas: createdTransaction.baseGas,
      gasPrice: createdTransaction.gasPrice,
      tokenGasPriceFactor: createdTransaction.tokenGasPriceFactor,
      gasToken: createdTransaction.gasToken,
      refundReceiver: createdTransaction.refundReceiver
    }

    const estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto = {
      chainId,
      version,
      transaction: txn,
      walletAddress: smartAccountState.address,
      feeRefund: refundInfo,
      signature: FAKE_SIGNATURE
    }

    const ethCallOverrideResponse = await this.nodeClient.estimateUndeployedContractGas(
      estimateUndeployedContractGasDto
    )
    const noAuthEstimate =
      Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas)
    Logger.warn('no auth no refund estimate', noAuthEstimate)

    estimatedGasUsed += noAuthEstimate

    return estimatedGasUsed
  }

  async estimateTransactionBatch(
    getFeeQuotesForBatchDto: GetFeeQuotesForBatchDto,
    createdTransaction: IWalletTransaction,
    smartAccountState: SmartAccountState
  ): Promise<number> {
    const { chainId, version } = getFeeQuotesForBatchDto
    let estimatedGasUsed = 0
    // Check if available from current state
    const isDeployed = await this.contractUtils.isDeployed(chainId, smartAccountState.address)
    if (!isDeployed) {
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId,
        version,
        owner: smartAccountState.owner
      })
      Logger.log('estimateWalletDeployment ', estimateWalletDeployment)
      estimatedGasUsed += estimateWalletDeployment
    }

    const txn: ExecTransaction = {
      to: createdTransaction.to,
      value: createdTransaction.value,
      data: createdTransaction.data,
      operation: createdTransaction.operation,
      targetTxGas: createdTransaction.targetTxGas
    }

    // to avoid failing eth_call override with undeployed wallet
    txn.targetTxGas = 500000

    const refundInfo: IFeeRefundV1_0_1 = {
      baseGas: createdTransaction.baseGas,
      gasPrice: createdTransaction.gasPrice,
      tokenGasPriceFactor: createdTransaction.tokenGasPriceFactor,
      gasToken: createdTransaction.gasToken,
      refundReceiver: createdTransaction.refundReceiver
    }

    const estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto = {
      chainId,
      version,
      transaction: txn,
      walletAddress: smartAccountState.address,
      feeRefund: refundInfo,
      signature: FAKE_SIGNATURE
    }

    const ethCallOverrideResponse = await this.nodeClient.estimateUndeployedContractGas(
      estimateUndeployedContractGasDto
    )
    const noAuthEstimate =
      Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas)
    Logger.log('no auth no refund estimate', noAuthEstimate)

    estimatedGasUsed += noAuthEstimate

    return estimatedGasUsed
  }

  // Generic function to estimate gas used for any contract call
  async estimateGasUsed(target: string, data: string, chainId: number): Promise<number> {
    const estimatorInterface = new ethers.utils.Interface(GasEstimator.abi)
    const encodedEstimateData = estimatorInterface.encodeFunctionData('estimate', [target, data])

    const estimateGasUsedResponse = await this.nodeClient.estimateExternalGas({
      chainId,
      encodedData: encodedEstimateData
    })
    return Number(estimateGasUsedResponse.data.gas)
  }

  async estimateSmartAccountDeployment(
    estimateSmartAccountDeploymentDto: EstimateSmartAccountDeploymentDto
  ): Promise<number> {
    const estimatorInterface = new ethers.utils.Interface(GasEstimator.abi)
    const { chainId, version, owner } = estimateSmartAccountDeploymentDto
    const walletFactoryInterface =
      this.contractUtils.smartWalletFactoryContract[chainId][version].getInterface()
    const encodedEstimateData = estimatorInterface.encodeFunctionData('estimate', [
      this.contractUtils.smartWalletFactoryContract[chainId][version].getAddress(),
      walletFactoryInterface.encodeFunctionData('deployCounterFactualAccount', [owner, 0])
    ])
    Logger.log('encodedEstimate ', encodedEstimateData)
    const deployCostresponse = await this.nodeClient.estimateExternalGas({
      chainId,
      encodedData: encodedEstimateData
    })
    const estimateWalletDeployment = Number(deployCostresponse.data.gas)
    Logger.log('estimateWalletDeployment ', estimateWalletDeployment)
    return estimateWalletDeployment
  }
}
