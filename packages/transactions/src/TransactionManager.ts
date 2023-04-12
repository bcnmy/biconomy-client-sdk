import { encodeTransfer } from './AccountUtils'
import {
  DEFAULT_FEE_RECEIVER,
  IMetaTransaction,
  MetaTransactionData,
  IWalletTransaction,
  OperationType,
  ZERO_ADDRESS,
  ChainId,
  FeeQuote,
  FeeOptionsResponse,
  TokenData,
  GAS_USAGE_OFFSET,
  IFeeRefundHandlePayment,
  EstimateSmartAccountDeploymentDto,
  SmartAccountState
} from '@biconomy/core-types'
import {
  GetFeeQuotesForBatchDto,
  GetFeeQuotesDto,
  TransactionDto,
  TransactionBatchDto,
  CreateUserPaidTransactionBatchDto,
  CreateUserPaidTransactionDto
} from './Types'
import EvmNetworkManager from '@biconomy/ethers-lib'
import { Estimator } from './Estimator'

import INodeClient, {
  EstimateRequiredTxGasDto,
  EstimateHandlePaymentTxGasDto
} from '@biconomy/node-client'

import { IRelayer } from '@biconomy/relayer'
import { Logger } from '@biconomy/common'
import ContractUtils from './ContractUtils'
import { Utils } from './Utils'
class TransactionManager {
  // chainId: ChainId

  // Need setters
  nodeClient!: INodeClient
  estimator!: Estimator
  contractUtils!: ContractUtils
  relayer!: IRelayer

  utils!: Utils

  constructor(readonly smartAccountState: SmartAccountState) {
    this.utils = new Utils()
  }

  // smart account config and context
  async initialize(relayer: IRelayer, nodeClient: INodeClient, contractUtils: ContractUtils) {
    // Note: smart account is state specific so we may end up using chain specific transaction managers as discussed.

    this.nodeClient = nodeClient
    // this.nodeClient = new NodeClient({ txServiceUrl: config.backendUrl })

    this.contractUtils = contractUtils

    this.relayer = relayer

    // estimator init
    this.estimator = new Estimator(this.nodeClient, this.contractUtils)
  }

  setRelayer(relayer: IRelayer): TransactionManager {
    this.relayer = relayer
    return this
  }

  getContractUtilInstance(): ContractUtils {
    return this.contractUtils
  }

  getEstimatorInstance(): Estimator {
    return this.estimator
  }

  // review return type
  getNodeClient(): INodeClient {
    return this.nodeClient
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  async createTransaction(transactionDto: TransactionDto): Promise<IWalletTransaction> {
    const { transaction, chainId, version } = transactionDto
    const batchId = 1 // fixed nonce space for forward

    const multiSendContract = this.contractUtils.multiSendContract[chainId][version].getContract()
    const isDelegate = transactionDto.transaction.to === multiSendContract.address ? true : false

    const smartAccountState = await this.contractUtils.getSmartAccountState()

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(smartAccountState.address)

    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, smartAccountState.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    Logger.log('nonce: ', nonce)

    const operation = isDelegate ? 1 : 0

    const walletTx: IWalletTransaction = this.utils.buildSmartAccountTransaction({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data, // for token transfers use encodeTransfer
      nonce,
      operation
    })

    return walletTx
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is without fee refund (gasless)
   * @param transaction
   * @param chainId
   * @returns
   */
  async createTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<IWalletTransaction> {
    const { transactions, chainId, version } = transactionBatchDto
    // NOTE : If the wallet is not deployed yet then nonce would be zero
    const batchId = 1 //fixed nonce space for forward

    const smartAccountState = await this.contractUtils.getSmartAccountState()
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(smartAccountState.address)

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, smartAccountState.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    Logger.log('nonce: ', nonce)

    const txs: IMetaTransaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      const innerTx: IWalletTransaction = this.utils.buildSmartAccountTransaction({
        to: transactions[i].to,
        value: transactions[i].value,
        data: transactions[i].data, // for token transfers use encodeTransfer
        nonce: 0
      })

      txs.push(innerTx)
    }

    const walletTx: IWalletTransaction = this.utils.buildMultiSendSmartAccountTx(
      this.contractUtils.multiSendContract[chainId][version].getContract(),
      txs,
      nonce
    )
    Logger.log('wallet txn without refund ', walletTx)

    return walletTx
  }

  async estimateTransaction(prepareTransactionDto: GetFeeQuotesDto): Promise<number> {
    const { transaction, chainId, version } = prepareTransactionDto

    const smartAccountState = await this.contractUtils.getSmartAccountState()

    // OR just like contractUtils manages context, this class manages state getState(chainId) method
    // const state = await this.getSmartAccountState(chainId);

    // try catch
    const tx = await this.createTransaction({ version, transaction, chainId: chainId })

    // try catch
    const estimatedGasUsed = await this.estimator.estimateTransaction(
      prepareTransactionDto,
      tx,
      smartAccountState
    )
    return estimatedGasUsed
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param getFeeQuotesDto
   */
  async getFeeQuotes(getFeeQuotesDto: GetFeeQuotesDto): Promise<FeeQuote[]> {
    const { transaction, chainId, version } = getFeeQuotesDto

    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)
    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response
    const feeQuotes: Array<FeeQuote> = []

    // 1. If wallet is deployed
    // 2. If wallet is not deployed (batch wallet deployment on multisend)
    // actual estimation with dummy sig
    // eth_call to rescue : undeployed /deployed wallet with override bytecode SmartWalletNoAuth
    const estimatedGasUsed: number = await this.estimateTransaction({
      version,
      transaction,
      chainId: chainId
    })

    // also relayer would give feeReceiver that becomes part of feeQuote

    feeOptionsAvailable.forEach((feeOption) => {
      const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0
      const offset = feeOption.offset || 1
      const payment = (tokenGasPrice * (estimatedGasUsed + feeTokenTransferGas)) / offset

      const feeQuote = {
        symbol: feeOption.symbol,
        address: feeOption.address,
        decimal: feeOption.decimal,
        logoUrl: feeOption.logoUrl,
        tokenGasPrice: feeOption.tokenGasPrice,
        offset: feeOption.offset,
        payment: payment,
        refundReceiver: feeOption.refundReceiver
      }

      feeQuotes.push(feeQuote)
    })

    return feeQuotes
  }

  async estimateTransactionBatch(
    getFeeQuotesForBatchDto: GetFeeQuotesForBatchDto
  ): Promise<number> {
    const { transactions, chainId, version } = getFeeQuotesForBatchDto

    const smartAccountState = await this.contractUtils.getSmartAccountState()
    const tx = await this.createTransactionBatch({
      version,
      transactions,
      chainId: chainId
    })
    // try catch
    const estimatedGasUsed = await this.estimator.estimateTransactionBatch(
      getFeeQuotesForBatchDto,
      tx,
      smartAccountState
    )
    return estimatedGasUsed
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param getFeeQuotesForBatchDto
   */
  async getFeeQuotesForBatch(
    getFeeQuotesForBatchDto: GetFeeQuotesForBatchDto
  ): Promise<FeeQuote[]> {
    const { transactions, chainId, version } = getFeeQuotesForBatchDto
    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)

    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response
    const feeQuotes: Array<FeeQuote> = []

    // 1. If wallet is deployed
    // 2. If wallet is not deployed (batch wallet deployment on multisend)
    // actual estimation with dummy sig
    // eth_call to rescue : undeployed /deployed wallet with override bytecode SmartWalletNoAuth

    // this.createTransaction
    // pass to estimator method
    const estimatedGasUsed: number = await this.estimateTransactionBatch({
      version,
      transactions,
      chainId: chainId
    })

    feeOptionsAvailable.forEach((feeOption) => {
      const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0
      const offset = feeOption.offset || 1
      const payment = (tokenGasPrice * (estimatedGasUsed + feeTokenTransferGas)) / offset

      const feeQuote = {
        symbol: feeOption.symbol,
        address: feeOption.address,
        decimal: feeOption.decimal,
        logoUrl: feeOption.logoUrl,
        tokenGasPrice: feeOption.tokenGasPrice,
        offset: feeOption.offset,
        payment: payment,
        refundReceiver: feeOption.refundReceiver
      }

      feeQuotes.push(feeQuote)
    })

    return feeQuotes
  }

  async estimateSmartAccountDeployment(
    estimateSmartAccountDeploymentDto: EstimateSmartAccountDeploymentDto
  ): Promise<number> {
    // Try catch
    const estimateWalletDeployment = await this.estimator.estimateSmartAccountDeployment(
      estimateSmartAccountDeploymentDto
    )
    return estimateWalletDeployment
  }

  async estimateGasUsed(target: string, data: string, chainId: number): Promise<number> {
    const gasUsed = await this.estimator.estimateGasUsed(target, data, chainId)
    return gasUsed
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param createUserPaidTransactionDto
   * @returns
   */
  async createUserPaidTransaction(
    createUserPaidTransactionDto: CreateUserPaidTransactionDto
  ): Promise<IWalletTransaction> {
    const { transaction, feeQuote, chainId, version } = createUserPaidTransactionDto
    const batchId = 1 // Fixed nonce space for forward

    const smartAccountState = await this.contractUtils.getSmartAccountState()
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(smartAccountState.address)

    let additionalBaseGas = 0

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    const isDeployed = await this.contractUtils.isDeployed(chainId, smartAccountState.address)
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId: chainId,
        version,
        owner: smartAccountState.owner
      })
      // We know it's going to get deployed by Relayer but we handle refund cost here..
      additionalBaseGas += estimateWalletDeployment // wallet deployment gas
    }
    Logger.log('nonce: ', nonce)

    // in terms of calculating baseGas we should know if wallet is deployed or not otherwise it needs to consider deployment cost
    // (will get batched by relayer)

    const internalTx: MetaTransactionData = {
      to: transaction.to,
      value: transaction.value || 0,
      data: transaction.data || '0x',
      operation: OperationType.Call
    }
    Logger.log('internalTx: ', internalTx)

    let targetTxGas, baseGas, handlePaymentEstimate
    const regularOffSet = GAS_USAGE_OFFSET

    if (!isDeployed) {
      // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
      // targetTxGas?
      // i. use really high value
      // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !]

      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: smartAccountState.address,
        transaction: internalTx
      }
      const response = await this.nodeClient.estimateRequiredTxGasOverride(estimateRequiredTxGas)
      const requiredTxGasEstimate = Number(response.data.gas) + 700000
      Logger.log('required txgas estimate (with override) ', requiredTxGasEstimate)
      targetTxGas = requiredTxGasEstimate

      // baseGas?
      // Depending on feeToken provide baseGas! We could use constant value provided by the relayer

      const refundDetails: IFeeRefundHandlePayment = {
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice,
        tokenGasPriceFactor: feeQuote.offset || 1,
        gasToken: feeQuote.address,
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }
      const estimateHandlePaymentGas: EstimateHandlePaymentTxGasDto = {
        chainId: chainId,
        version: version,
        walletAddress: smartAccountState.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGasOverride(
        estimateHandlePaymentGas
      )
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

      Logger.log('handlePaymentEstimate (with override) ', handlePaymentEstimate)
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas
    } else {
      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: smartAccountState.address,
        transaction: internalTx
      }

      const response = await this.nodeClient.estimateRequiredTxGas(estimateRequiredTxGas)
      // TODO
      // handle exception responses and when gas returned is 0
      const requiredTxGasEstimate = Number(response.data.gas) + 30000
      Logger.log('required txgas estimate ', requiredTxGasEstimate)
      targetTxGas = requiredTxGasEstimate

      const refundDetails: IFeeRefundHandlePayment = {
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice,
        tokenGasPriceFactor: feeQuote.offset || 1,
        gasToken: feeQuote.address,
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }

      const estimateHandlePaymentGas: EstimateHandlePaymentTxGasDto = {
        chainId: chainId,
        version: version,
        walletAddress: smartAccountState.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGas(
        estimateHandlePaymentGas
      )
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

      Logger.log('handlePaymentEstimate ', handlePaymentEstimate)

      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas // delegate call + event emission + state updates + potential deployment
    }

    const walletTx: IWalletTransaction = this.utils.buildSmartAccountTransaction({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data, // for token transfers use encodeTransfer
      targetTxGas: targetTxGas,
      baseGas,
      refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS,
      gasPrice: feeQuote.tokenGasPrice.toString(), //review
      tokenGasPriceFactor: feeQuote.offset || 1,
      gasToken: feeQuote.address,
      nonce
    })

    return walletTx
  }

  /**
   * Prepares compatible IWalletTransaction object based on Transaction Request
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param createUserPaidTransactionBatchDto
   * @returns
   */
  async createUserPaidTransactionBatch(
    createUserPaidTransactionBatchDto: CreateUserPaidTransactionBatchDto
  ): Promise<IWalletTransaction> {
    const { transactions, feeQuote, chainId, version } = createUserPaidTransactionBatchDto
    const batchId = 1 // Fixed nonce space for Forward
    const smartAccountState = await this.contractUtils.getSmartAccountState()
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    const connectedWallet = smartAccountState.address
    walletContract = walletContract.attach(connectedWallet)

    const isDeployed = smartAccountState.isDeployed
    // await this.contractUtils.isDeployed(chainId, version, smartAccountState.address);
    let additionalBaseGas = 0

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      // TODO : estimation cost can be passed which is constant for biconomy smart account deployment
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId: chainId,
        version,
        owner: smartAccountState.owner
      })
      // We know it's going to get deployed by Relayer but we handle refund cost here..
      Logger.log('estimateWalletDeployment ', estimateWalletDeployment)

      // We know it's going to get deployed by Relayer
      // but we handle refund cost here..
      additionalBaseGas += estimateWalletDeployment // wallet deployment gas
    }
    Logger.log('nonce: ', nonce)

    const txs: IMetaTransaction[] = this.utils.buildSmartAccountTransactions(transactions)

    const walletTx: IWalletTransaction = this.utils.buildMultiSendSmartAccountTx(
      this.contractUtils.multiSendContract[chainId][version].getContract(),
      txs,
      nonce
    )
    Logger.log('wallet txn with refund ', walletTx)

    const internalTx: MetaTransactionData = {
      to: walletTx.to,
      value: walletTx.value || 0,
      data: walletTx.data || '0x',
      operation: walletTx.operation
    }
    Logger.log('internalTx ', internalTx)

    let targetTxGas, baseGas
    const regularOffSet = GAS_USAGE_OFFSET

    if (!isDeployed) {
      // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
      // targetTxGas?
      // i. use really high value
      // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !]
      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: smartAccountState.address,
        transaction: internalTx
      }
      const response = await this.nodeClient.estimateRequiredTxGasOverride(estimateRequiredTxGas)

      // not getting accurate value for undeployed wallet
      // TODO
      const requiredTxGasEstimate = Number(response.data.gas) + 700000
      Logger.log('required txgas estimate (with override) ', requiredTxGasEstimate)
      targetTxGas = requiredTxGasEstimate

      // baseGas?
      // Allow overriding wallet address just for this estimations
      // Depending on feeToken provide baseGas! We could use constant value provided by the relayer

      const refundDetails: IFeeRefundHandlePayment = {
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice, // this would be token gas price // review
        tokenGasPriceFactor: feeQuote.offset || 1,
        gasToken: feeQuote.address,
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }

      const estimateHandlePaymentGas: EstimateHandlePaymentTxGasDto = {
        chainId: chainId,
        version: version,
        walletAddress: smartAccountState.address,
        feeRefund: refundDetails
      }

      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGasOverride(
        estimateHandlePaymentGas
      )
      const handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      Logger.log('handlePaymentEstimate (with override) ', handlePaymentEstimate)
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas
    } else {
      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: smartAccountState.address,
        transaction: internalTx
      }

      const response = await this.nodeClient.estimateRequiredTxGas(estimateRequiredTxGas)
      // considerable offset ref gnosis safe service client safeTxGas
      // TODO
      // handle exception responses and when gas returned is 0
      // We could stop the further flow
      const requiredTxGasEstimate = Number(response.data.gas) + 30000
      Logger.log('required txgas estimate ', requiredTxGasEstimate)
      targetTxGas = requiredTxGasEstimate

      const refundDetails: IFeeRefundHandlePayment = {
        gasUsed: requiredTxGasEstimate,
        baseGas: requiredTxGasEstimate,
        gasPrice: feeQuote.tokenGasPrice, // this would be token gas price
        tokenGasPriceFactor: feeQuote.offset || 1,
        gasToken: feeQuote.address,
        refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS
      }

      const estimateHandlePaymentGas: EstimateHandlePaymentTxGasDto = {
        chainId: chainId,
        version: version,
        walletAddress: smartAccountState.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGas(
        estimateHandlePaymentGas
      )
      const handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      Logger.log('handlePaymentEstimate ', handlePaymentEstimate)
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas // delegate call + event emission + state updates + potential deployment
    }

    const finalWalletTx: IWalletTransaction = this.utils.buildSmartAccountTransaction({
      to: walletTx.to,
      value: walletTx.value,
      data: walletTx.data, // for token transfers use encodeTransfer
      operation: walletTx.operation,
      targetTxGas: targetTxGas,
      baseGas: baseGas,
      refundReceiver: feeQuote.refundReceiver || ZERO_ADDRESS,
      gasPrice: feeQuote.tokenGasPrice.toString(), //review
      tokenGasPriceFactor: feeQuote.offset || 1,
      gasToken: feeQuote.address,
      nonce
    })

    return finalWalletTx
  }

  ethersAdapter(chainId: ChainId): EvmNetworkManager {
    return this.contractUtils.ethAdapter[chainId]
  }
}

export default TransactionManager
