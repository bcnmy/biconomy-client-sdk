import { encodeTransfer } from './account-utils'
import {
  DEFAULT_FEE_RECEIVER,
  PrepareRefundTransactionsDto,
  PrepareRefundTransactionDto,
  TransactionDto,
  TransactionBatchDto,
  RefundTransactionBatchDto,
  MetaTransaction,
  MetaTransactionData,
  RefundTransactionDto,
  WalletTransaction,
  OperationType,
  ZERO_ADDRESS,
  ChainId,
  FeeQuote,
  FeeOptionsResponse,
  TokenData,
  GAS_USAGE_OFFSET,
  FeeRefundHandlePayment,
  EstimateSmartAccountDeploymentDto,
  SmartAccountState
} from '@biconomy-sdk/core-types'
import { ethers } from 'ethers'
import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { GasEstimator } from './assets'
import { Estimator } from './estimator'

import NodeClient, {
  EstimateRequiredTxGasDto,
  EstimateHandlePaymentTxGasDto
} from '@biconomy-sdk/node-client'

import { Relayer } from '@biconomy-sdk/relayer'
import ContractUtils from './contract-utils'
import { Utils } from './utils'
class TransactionManager {

  // chainId: ChainId

  // Need setters
  nodeClient!: NodeClient
  estimator!: Estimator
  contractUtils!: ContractUtils
  relayer!: Relayer

  utils!: Utils

  smartAccountState!: SmartAccountState


  constructor() {
    this.utils = new Utils()
  }

  // smart account config and context  
  async initialize(relayer: Relayer, nodeClient: NodeClient, contractUtils: ContractUtils, smartAccountState: SmartAccountState) {

    // Note: smart account is state specific so we may end up using chain specific transaction managers as discussed.

    this.smartAccountState = smartAccountState

    this.nodeClient = nodeClient
    // this.nodeClient = new NodeClient({ txServiceUrl: config.backend_url })

    this.contractUtils = contractUtils

    this.relayer = relayer

    // estimator init
    this.estimator = new Estimator(this.nodeClient, this.contractUtils)
  }

  setRelayer(relayer: Relayer) {
    this.relayer = relayer
    return this
  }

  async getContractUtilInstance(): Promise<ContractUtils> {
    return this.contractUtils
  }

  async getEstimatorInstance(): Promise<Estimator> {
    return this.estimator
  }

  async getNodeClient(): Promise<NodeClient> {
    return this.nodeClient
  }

  async prepareDeployAndPayFees(chainId: ChainId, version: string) {
    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)
    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response;
    let feeQuotes: Array<FeeQuote> = [];

    const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
      chainId: chainId,
      version,
      owner: this.smartAccountState.owner,
      entryPointAddress: this.smartAccountState.entryPointAddress,
      fallbackHandlerAddress: this.smartAccountState.fallbackHandlerAddress
    })

    feeOptionsAvailable.forEach((feeOption) => {
      // TODO
      // Make it a constant
      const estimatedGasUsed: number = (estimateWalletDeployment + 77369);

      // const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0;
      const offset = feeOption.offset || 1;
      let payment = tokenGasPrice * (estimatedGasUsed) / offset;

      let feeQuote = {
        symbol: feeOption.symbol,
        address: feeOption.address,
        decimal: feeOption.decimal,
        logoUrl: feeOption.logoUrl,
        tokenGasPrice: feeOption.tokenGasPrice,
        offset: feeOption.offset,
        payment: payment,
        refundReceiver: feeOption.refundReceiver
      }

      feeQuotes.push(feeQuote);
    });

    return feeQuotes;
  }

  // Onboarding scenario where assets inside counterfactual smart account pays for it's deployment
  async deployAndPayFees(chainId: ChainId, version: string, feeQuote: FeeQuote): Promise<WalletTransaction> {
    const token = feeQuote.address;
    const offset = feeQuote.offset || 1;
    const feeReceiver = feeQuote.refundReceiver || DEFAULT_FEE_RECEIVER;

    const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
      chainId: chainId,
      version,
      owner: this.smartAccountState.owner,
      entryPointAddress: this.smartAccountState.entryPointAddress,
      fallbackHandlerAddress: this.smartAccountState.fallbackHandlerAddress
    })
    // do estimations here or pass on payment and use feeQuote fully!
    let feesToPay = feeQuote.tokenGasPrice * (estimateWalletDeployment + 77369) / offset;
    feesToPay = parseInt(feesToPay.toString());

    const tx = {
      to: token,
      data: encodeTransfer(feeReceiver, Number(feesToPay))
    };

    const transaction = await this.createTransaction({ version, transaction: tx, batchId: 0, chainId: chainId });
    return transaction
  }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is without fee refund (gasless)
   * @param transactionDto
   * @returns
   */
  async createTransaction(transactionDto: TransactionDto): Promise<WalletTransaction> {
    const { transaction, batchId = 0, chainId, version } = transactionDto

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(this.smartAccountState.address)

    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, version, this.smartAccountState.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const walletTx: WalletTransaction = this.utils.buildSmartAccountTransaction({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data, // for token transfers use encodeTransfer
      nonce
    })

    return walletTx
  }

  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Write test case and limit batch size based on test results in scw-contracts
   * @notice This transaction is without fee refund (gasless)
   * @param transaction
   * @param batchId
   * @param chainId
   * @returns
   */
  // TODO: Merge this method with createTransaction, both batch and single transactions can be batched in same transactions
  async createTransactionBatch(
    transactionBatchDto: TransactionBatchDto
  ): Promise<WalletTransaction> {
    const { transactions, batchId, chainId, version } = transactionBatchDto
    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(this.smartAccountState.address)

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, version, this.smartAccountState.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const txs: MetaTransaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      const innerTx: WalletTransaction = this.utils.buildSmartAccountTransaction({
        to: transactions[i].to,
        value: transactions[i].value,
        data: transactions[i].data, // for token transfers use encodeTransfer
        nonce: 0
      })

      txs.push(innerTx)
    }

    const walletTx: WalletTransaction = this.utils.buildMultiSendSmartAccountTx(
      this.contractUtils.multiSendContract[chainId][version].getContract(),
      txs,
      nonce
    )
    console.log('wallet txn without refund ', walletTx)

    return walletTx
  }

  async estimateTransaction(prepareTransactionDto: PrepareRefundTransactionDto): Promise<number> {
    const {
      transaction,
      batchId,
      chainId,
      version
    } = prepareTransactionDto
    // OR just like contractUtils manages context, this class manages state getState(chainId) method
    // const state = await this.getSmartAccountState(chainId);    

    // try catch
    const tx = await this.createTransaction({ version, transaction, batchId, chainId: chainId });

    // try catch
    let estimatedGasUsed = await this.estimator.estimateTransaction(prepareTransactionDto, tx, this.smartAccountState);
    return estimatedGasUsed;
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param prepareRefundTransactionDto
   */
  async prepareRefundTransaction(
    prepareRefundTransactionDto: PrepareRefundTransactionDto
  ): Promise<FeeQuote[]> {
    // TODO
    // Review @Talha
    const {
      transaction,
      batchId,
      chainId,
      version
    } = prepareRefundTransactionDto

    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)
    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response
    let feeQuotes: Array<FeeQuote> = []

    // 1. If wallet is deployed
    // 2. If wallet is not deployed (batch wallet deployment on multisend)
    // actual estimation with dummy sig
    // eth_call to rescue : undeployed /deployed wallet with override bytecode SmartWalletNoAuth
    const estimatedGasUsed: number = await this.estimateTransaction({
      version,
      transaction,
      batchId,
      chainId: chainId
    })

    // also relayer would give feeReceiver that becomes part of feeQuote

    feeOptionsAvailable.forEach((feeOption) => {
      const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0
      const offset = feeOption.offset || 1
      let payment = tokenGasPrice * (estimatedGasUsed + feeTokenTransferGas) / offset;

      let feeQuote = {
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

  async estimateTransactionBatch(prepareRefundTransactionsDto: PrepareRefundTransactionsDto): Promise<number> {

    const { transactions, batchId, chainId, version } = prepareRefundTransactionsDto
    const tx = await this.createTransactionBatch({ version, transactions, batchId, chainId: chainId });
    // try catch
    let estimatedGasUsed = await this.estimator.estimateTransactionBatch(prepareRefundTransactionsDto, tx, this.smartAccountState);
    return estimatedGasUsed;
  }

  // Get Fee Options from relayer and make it available for display
  // We can also show list of transactions to be processed (decodeContractCall)
  /**
   *
   * @param prepareRefundTransactionsDto
   */
  // TODO: Rename method to getFeeOptionsForBatch
  async prepareRefundTransactionBatch(
    prepareRefundTransactionsDto: PrepareRefundTransactionsDto
  ): Promise<FeeQuote[]> {
    const {
      transactions,
      batchId,
      chainId,
      version
    } = prepareRefundTransactionsDto
    console.log('calling getFeeOptions');

    const gasPriceQuotesResponse: FeeOptionsResponse = await this.relayer.getFeeOptions(chainId)
    console.log('gasPriceQuotesResponse ');

    const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response
    let feeQuotes: Array<FeeQuote> = []

    // 1. If wallet is deployed
    // 2. If wallet is not deployed (batch wallet deployment on multisend)
    // actual estimation with dummy sig
    // eth_call to rescue : undeployed /deployed wallet with override bytecode SmartWalletNoAuth

    // this.createTransaction
    // pass to estimator method
    const estimatedGasUsed: number = await this.estimateTransactionBatch({
      version,
      transactions,
      batchId,
      chainId: chainId
    })

    feeOptionsAvailable.forEach((feeOption) => {
      const feeTokenTransferGas = feeOption.feeTokenTransferGas
      const tokenGasPrice = feeOption.tokenGasPrice || 0
      const offset = feeOption.offset || 1
      let payment = tokenGasPrice * (estimatedGasUsed + feeTokenTransferGas) / offset;

      let feeQuote = {
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

  async estimateSmartAccountDeployment(estimateSmartAccountDeploymentDto: EstimateSmartAccountDeploymentDto): Promise<number> {
    const estimatorInterface = new ethers.utils.Interface(GasEstimator.abi);
    // Try catch
    const estimateWalletDeployment = await this.estimator.estimateSmartAccountDeployment(estimateSmartAccountDeploymentDto);
    return estimateWalletDeployment;
  }


  /**
   * Prepares compatible WalletTransaction object based on Transaction Request
   * @todo Rename based on other variations to prepare transaction
   * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
   * @param refundTransactionDto
   * @returns
   */
  async createRefundTransaction(
    refundTransactionDto: RefundTransactionDto
  ): Promise<WalletTransaction> {
    const { transaction, feeQuote, batchId, chainId, version } = refundTransactionDto
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(this.smartAccountState.address)

    let additionalBaseGas = 0

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    const isDeployed = await this.contractUtils.isDeployed(chainId, version, this.smartAccountState.address)
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId: chainId,
        version,
        owner: this.smartAccountState.owner,
        entryPointAddress: this.smartAccountState.entryPointAddress,
        fallbackHandlerAddress: this.smartAccountState.fallbackHandlerAddress
      })
      // We know it's going to get deployed by Relayer but we handle refund cost here..
      additionalBaseGas += estimateWalletDeployment // wallet deployment gas
    }
    console.log('nonce: ', nonce)

    // in terms of calculating baseGas we should know if wallet is deployed or not otherwise it needs to consider deployment cost
    // (will get batched by relayer)

    const internalTx: MetaTransactionData = {
      to: transaction.to,
      value: transaction.value || 0,
      data: transaction.data || '0x',
      operation: OperationType.Call
    }
    console.log(internalTx)

    let targetTxGas, baseGas, handlePaymentEstimate
    const regularOffSet = GAS_USAGE_OFFSET

    if (!isDeployed) {
      // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
      // targetTxGas?
      // i. use really high value
      // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !]

      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: this.smartAccountState.address,
        transaction: internalTx
      }
      const response = await this.nodeClient.estimateRequiredTxGasOverride(estimateRequiredTxGas)
      // TODO
      // Review
      const requiredTxGasEstimate = Number(response.data.gas) + 700000
      console.log('required txgas estimate (with override) ', requiredTxGasEstimate)
      targetTxGas = requiredTxGasEstimate

      // baseGas?
      // Depending on feeToken provide baseGas! We could use constant value provided by the relayer

      const refundDetails: FeeRefundHandlePayment = {
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
        walletAddress: this.smartAccountState.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGasOverride(
        estimateHandlePaymentGas
      )
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

      console.log('handlePaymentEstimate (with override) ', handlePaymentEstimate)
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas
    } else {
      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: this.smartAccountState.address,
        transaction: internalTx
      }

      const response = await this.nodeClient.estimateRequiredTxGas(estimateRequiredTxGas)
      // considerable offset ref gnosis safe service client safeTxGas
      // @Talha
      // TODO
      // handle exception responses and when gas returned is 0
      // We could stop the further flow
      const requiredTxGasEstimate = Number(response.data.gas) + 30000
      console.log('required txgas estimate ', requiredTxGasEstimate)
      targetTxGas = requiredTxGasEstimate

      const refundDetails: FeeRefundHandlePayment = {
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
        walletAddress: this.smartAccountState.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGas(estimateHandlePaymentGas)
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

      console.log('handlePaymentEstimate ', handlePaymentEstimate)

      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas // delegate call + event emission + state updates + potential deployment
    }

    const walletTx: WalletTransaction = this.utils.buildSmartAccountTransaction({
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
 * Prepares compatible WalletTransaction object based on Transaction Request
 * @todo Rename based on other variations to prepare transaction
 * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
 * @param refundTransactionBatchDto
 * @returns
 */
  async createRefundTransactionBatch(
    refundTransactionBatchDto: RefundTransactionBatchDto
  ): Promise<WalletTransaction> {
    const {
      transactions,
      feeQuote,
      batchId,
      chainId,
      version
    } = refundTransactionBatchDto
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    const connectedWallet = this.smartAccountState.address
    walletContract = walletContract.attach(connectedWallet)

    // TODO
    // Review
    const isDeployed = this.smartAccountState.isDeployed
    // await this.contractUtils.isDeployed(chainId, version, this.smartAccountState.address);
    let additionalBaseGas = 0;

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      // TODO : estimation cost can be passed
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId: chainId,
        version,
        owner: this.smartAccountState.owner,
        entryPointAddress: this.smartAccountState.entryPointAddress,
        fallbackHandlerAddress: this.smartAccountState.fallbackHandlerAddress
      })
      // We know it's going to get deployed by Relayer but we handle refund cost here..
      console.log('estimateWalletDeployment ', estimateWalletDeployment)

      // We know it's going to get deployed by Relayer
      // but we handle refund cost here..
      additionalBaseGas += estimateWalletDeployment // wallet deployment gas
    }
    console.log('nonce: ', nonce)

    const txs: MetaTransaction[] = this.utils.buildSmartAccountTransactions(transactions)

    const walletTx: WalletTransaction = this.utils.buildMultiSendSmartAccountTx(
      this.contractUtils.multiSendContract[chainId][version].getContract(),
      txs,
      nonce
    );
    console.log('wallet txn with refund ', walletTx);

    const internalTx: MetaTransactionData = {
      to: walletTx.to,
      value: walletTx.value || 0,
      data: walletTx.data || '0x',
      operation: walletTx.operation
    }
    console.log(internalTx);

    let targetTxGas, baseGas;
    const regularOffSet = GAS_USAGE_OFFSET;

    if (!isDeployed) {
      // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
      // targetTxGas?
      // i. use really high value 
      // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !]
      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: this.smartAccountState.address,
        transaction: internalTx
      }
      const response = await this.nodeClient.estimateRequiredTxGasOverride(estimateRequiredTxGas)

      // not getting accurate value for undeployed wallet
      // TODO
      // Review
      const requiredTxGasEstimate = Number(response.data.gas) + 700000
      console.log('required txgas estimate (with override) ', requiredTxGasEstimate);
      targetTxGas = requiredTxGasEstimate;

      // baseGas?
      // Depending on feeToken provide baseGas! We could use constant value provided by the relayer

      const refundDetails: FeeRefundHandlePayment = {
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
        walletAddress: this.smartAccountState.address,
        feeRefund: refundDetails
      }

      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGasOverride(
        estimateHandlePaymentGas
      )
      let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      console.log('handlePaymentEstimate (with override) ', handlePaymentEstimate);
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas;
    } else {

      const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
        chainId: chainId,
        walletAddress: this.smartAccountState.address,
        transaction: internalTx
      }

      const response = await this.nodeClient.estimateRequiredTxGas(estimateRequiredTxGas)
      // considerable offset ref gnosis safe service client safeTxGas
      // @Talha
      // TODO
      // handle exception responses and when gas returned is 0 
      // We could stop the further flow
      const requiredTxGasEstimate = Number(response.data.gas) + 30000
      console.log('required txgas estimate ', requiredTxGasEstimate);
      targetTxGas = requiredTxGasEstimate;

      const refundDetails: FeeRefundHandlePayment = {
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
        walletAddress: this.smartAccountState.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGas(estimateHandlePaymentGas)
      let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
      console.log('handlePaymentEstimate ', handlePaymentEstimate);
      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas; // delegate call + event emission + state updates + potential deployment
    }

    const finalWalletTx: WalletTransaction = this.utils.buildSmartAccountTransaction({
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

  ethersAdapter(chainId: ChainId): EthersAdapter {
    return this.contractUtils.ethAdapter[chainId]
  }
}

export default TransactionManager