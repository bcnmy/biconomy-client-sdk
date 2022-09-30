import { ethers } from 'ethers'
import { GasEstimator } from './assets'
import NodeClient, {
    ChainConfig,
    SupportedChainsResponse,
    SmartAccountsResponse,
    SmartAccountByOwnerDto,
    EstimateExternalGasDto,
    EstimateRequiredTxGasDto,
    EstimateHandlePaymentTxGasDto,
    EstimateUndeployedContractGasDto,
} from '@biconomy-sdk/node-client'
import { ContractUtils } from './contract-utils'
import {
    PrepareRefundTransactionDto,
    PrepareRefundTransactionsDto,
    EstimateSmartAccountDeploymentDto,
    WalletTransaction,
    FAKE_SIGNATURE,
    ExecTransaction,
    FeeRefundV1_0_1,
    SmartAccountState,
  } from '@biconomy-sdk/core-types'

export class Estimator {

    nodeClient!: NodeClient

    contractUtils!: ContractUtils

    // Note: Smart account state should Not be part of constructor
    constructor(nodeClient: NodeClient, contractUtils: ContractUtils) {
        this.nodeClient = nodeClient
        this.contractUtils = contractUtils
    }

    async estimateTransaction(prepareTransactionDto: PrepareRefundTransactionDto, createdTransaction: WalletTransaction, smartAccountState: SmartAccountState): Promise<number> {
        const {
            transaction,
            batchId,
            chainId,
            version
        } = prepareTransactionDto

        let estimatedGasUsed = 0;
        // Check if available from current state
        const isDeployed = await this.contractUtils.isDeployed(
            chainId,
            version,
            smartAccountState.address // SmartAccountState
        );
        if (!isDeployed) {
            const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
                chainId,
                version,
                owner: smartAccountState.owner, // SmartAccountState
                entryPointAddress: smartAccountState.entryPointAddress, // SmartAccountState
                fallbackHandlerAddress: smartAccountState.fallbackHandlerAddress // SmartAccountState
            })
            console.log('estimateWalletDeployment ', estimateWalletDeployment);

            estimatedGasUsed += estimateWalletDeployment;
        }

        const txn: ExecTransaction = {
            to: createdTransaction.to,
            value: createdTransaction.value,
            data: createdTransaction.data,
            operation: createdTransaction.operation,
            targetTxGas: createdTransaction.targetTxGas
        }

        // to avoid failing eth_call override with undeployed wallet
        txn.targetTxGas = 500000;

        const refundInfo: FeeRefundV1_0_1 = {
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

        const ethCallOverrideResponse = await this.nodeClient.estimateUndeployedContractGas(estimateUndeployedContractGasDto);
        let noAuthEstimate = Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas);
        console.log('no auth no refund estimate', noAuthEstimate);

        estimatedGasUsed += noAuthEstimate;

        return estimatedGasUsed;
    }

    async estimateTransactionBatch(prepareRefundTransactionsDto: PrepareRefundTransactionsDto, createdTransaction: WalletTransaction, smartAccountState: SmartAccountState): Promise<number> {

        const { transactions, batchId, chainId, version } = prepareRefundTransactionsDto
        let estimatedGasUsed = 0;
        // Check if available from current state
        const isDeployed = await this.contractUtils.isDeployed(chainId, version, smartAccountState.address);
        if (!isDeployed) {
            const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
                chainId,
                version,
                owner: smartAccountState.owner,
                entryPointAddress: smartAccountState.entryPointAddress,
                fallbackHandlerAddress: smartAccountState.fallbackHandlerAddress
            });
            console.log('estimateWalletDeployment ', estimateWalletDeployment);
            estimatedGasUsed += estimateWalletDeployment;
        }

        const txn: ExecTransaction = {
            to: createdTransaction.to,
            value: createdTransaction.value,
            data: createdTransaction.data,
            operation: createdTransaction.operation,
            targetTxGas: createdTransaction.targetTxGas
        }

        // to avoid failing eth_call override with undeployed wallet
        txn.targetTxGas = 500000;

        const refundInfo: FeeRefundV1_0_1 = {
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

        const ethCallOverrideResponse = await this.nodeClient.estimateUndeployedContractGas(estimateUndeployedContractGasDto);
        let noAuthEstimate = Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas);
        console.log('no auth no refund estimate', noAuthEstimate);

        estimatedGasUsed += noAuthEstimate;

        return estimatedGasUsed;
    }

    async estimateSmartAccountDeployment(estimateSmartAccountDeploymentDto: EstimateSmartAccountDeploymentDto): Promise<number> {
        const estimatorInterface = new ethers.utils.Interface(GasEstimator.abi);
        const { chainId, version, owner, entryPointAddress, fallbackHandlerAddress } = estimateSmartAccountDeploymentDto
        const walletFactoryInterface = this.contractUtils.smartWalletFactoryContract[chainId][version].getInterface();
        const encodedEstimateData = estimatorInterface.encodeFunctionData('estimate', [
            this.contractUtils.smartWalletFactoryContract[chainId][version].getAddress(),
            walletFactoryInterface.encodeFunctionData('deployCounterFactualWallet', [
                owner,
                entryPointAddress,
                fallbackHandlerAddress,
                0
            ])
        ])
        console.log('encodedEstimate ', encodedEstimateData)
        const deployCostresponse = await this.nodeClient.estimateExternalGas({ chainId, encodedData: encodedEstimateData });
        const estimateWalletDeployment = Number(deployCostresponse.data.gas);
        console.log('estimateWalletDeployment ', estimateWalletDeployment);
        return estimateWalletDeployment;
    }



}