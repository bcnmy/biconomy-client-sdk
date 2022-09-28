import { smartAccountSignMessage } from './execution'
import { encodeTransfer } from './utils'
import {
  SendTransactionDto,
  DEFAULT_FEE_RECEIVER,
  SignTransactionDto,
  PrepareRefundTransactionsDto,
  PrepareRefundTransactionDto,
  TransactionDto,
  TransactionBatchDto,
  RefundTransactionBatchDto,
  ExecTransaction,
  MetaTransaction,
  MetaTransactionData,
  RefundTransactionDto,
  WalletTransaction,
  Config,
  RawTransactionType,
  OperationType,
  ZERO_ADDRESS,
  FeeRefundV1_0_1,
  FeeRefundV1_0_0,
  ChainId,
  FeeQuote,
  FeeOptionsResponse,
  FAKE_SIGNATURE,
  TokenData,
  GAS_USAGE_OFFSET,
  FeeRefundHandlePayment,
  AddressForCounterFactualWalletDto,
  EstimateSmartAccountDeploymentDto
} from '@biconomy-sdk/core-types'
import { ethers, version } from 'ethers'
import EthersAdapter from '@biconomy-sdk/ethers-lib'
import { GasEstimator } from './assets'

import NodeClient, {
  ChainConfig,
  SupportedChainsResponse,
  SmartAccountsResponse,
  SmartAccountByOwnerDto,
  EstimateExternalGasDto,
  EstimateRequiredTxGasDto,
  EstimateHandlePaymentTxGasDto,
  EstimateUndeployedContractGasDto
} from '@biconomy-sdk/node-client'

import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers'
import { Relayer } from '@biconomy-sdk/relayer'
import {
  getSmartWalletFactoryContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSmartWalletContract,
  findChainById,
  findContractAddressesByVersion
} from './utils/FetchContractsInfo'
import { Web3Provider } from '@ethersproject/providers'
import ContractUtils from './contract-utils'
import { buildSmartAccountTransaction } from './execution'
import { buildMultiSendSmartAccountTx } from './multisend'

class Transaction {

  entryPointAddress = '0xF05217199F1C25604c67993F11a81461Bc97F3Ab'
  fallBackHandlerAddress = '0xf05217199f1c25604c67993f11a81461bc97f3ab'
  nodeClient!: NodeClient
  relayer!: Relayer

  // Owner of the Smart Account common between all chains
  // Could be part of Smart Account state / config
  // @review with Sachin
  owner!: string

  // Address of the smart contract wallet common between all chains
  // @review
  address!: string

  localConfig!: Config

  contractUtils!: ContractUtils

  // constructor(walletProvider: Web3Provider, config: Config) {
  //   this.localConfig = { ...DefaultConfig }

  //   if (config) {
  //     this.localConfig = { ...this.localConfig, ...config }
  //   }
  //   this.provider = walletProvider
  //   this.signer = walletProvider.getSigner()
  //   this.owner = this.localConfig.owner
  //   this.contractUtils = new ContractUtils()
  //   this.nodeClient = new NodeClient({ txServiceUrl: config.backend_url })
  // }

  constructor(){}
  async initialize(walletProvider: Web3Provider, config: Config){
    this.localConfig = { ...DefaultConfig }

    if (config) {
      this.localConfig = { ...this.localConfig, ...config }
    }
    const signer = walletProvider.getSigner()
    this.owner = await signer.getAddress()
    this.contractUtils = new ContractUtils()
    this.nodeClient = new NodeClient({ txServiceUrl: config.backend_url })
    await this.contractUtils.initialize(await this.nodeClient.getAllSupportedChains(), signer)
  }

  setRelayer(relayer: Relayer) {
    console.log('setting relayer');
    
    this.relayer = relayer
    console.log('relayer ', this.relayer);

  }

  async getContractUtilInstance(): Promise<ContractUtils>{
    return this.contractUtils
  }

  async getNodeClient(): Promise<NodeClient>{
    return this.nodeClient
  }

    /**
   *
   * @notice personal sign is used currently (// @todo Signer should be able to use _typedSignData)
   * @param tx WalletTransaction Smart Account Transaction object prepared
   * @param chainId optional chainId
   * @returns:string Signature
   */
     async signTransaction(signTransactionDto: SignTransactionDto): Promise<string> {
      const { chainId, tx, version, signer } = signTransactionDto
      let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
      walletContract = walletContract.attach(this.address)
  
      // TODO - rename and organize utils
      const { data } = await smartAccountSignMessage(signer, walletContract, tx, chainId)
  
      let signature = '0x'
      signature += data.slice(2)
      return signature
    }
  
  
  
    async prepareDeployAndPayFees(chainId: ChainId, version: string) {
      console.log('getFeeOptions ', this.relayer)
      const gasPriceQuotesResponse:FeeOptionsResponse = await this.relayer.getFeeOptions(chainId) 
      const feeOptionsAvailable: Array<TokenData> = gasPriceQuotesResponse.data.response;
      let feeQuotes: Array<FeeQuote> = [];
  
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId,
        version,
        owner: this.owner,
        entryPointAddress: this.entryPointAddress,
        fallbackHandlerAddress: this.fallBackHandlerAddress
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
      // Not checking again if the wallet is actually deployed
      // const isDeployed = await this.isDeployed(chainId);
      const token = feeQuote.address;
      const offset = feeQuote.offset || 1;
      const feeReceiver = feeQuote.refundReceiver || DEFAULT_FEE_RECEIVER;
    
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId,
        version,
        owner: this.owner,
        entryPointAddress: this.entryPointAddress,
        fallbackHandlerAddress: this.fallBackHandlerAddress
      })
      // do estimations here or pass on payment and use feeQuote fully!
      let feesToPay = feeQuote.tokenGasPrice * (estimateWalletDeployment + 77369) / offset;
      feesToPay = parseInt(feesToPay.toString());
  
      const tx = {
        to: token,
        data: encodeTransfer(feeReceiver, Number(feesToPay))
      };
  
      const transaction = await this.createTransaction({version, transaction: tx, batchId: 0, chainId});
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
    walletContract = walletContract.attach(this.address)

    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, version, this.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const walletTx: WalletTransaction = buildSmartAccountTransaction({
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
    const { transactions, chainId, batchId, version } = transactionBatchDto
    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let walletContract = this.contractUtils.smartWalletContract[chainId][version].getContract()
    walletContract = walletContract.attach(this.address)

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    if (await this.contractUtils.isDeployed(chainId, version, this.address)) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    }
    console.log('nonce: ', nonce)

    const txs: MetaTransaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      const innerTx: WalletTransaction = buildSmartAccountTransaction({
        to: transactions[i].to,
        value: transactions[i].value,
        data: transactions[i].data, // for token transfers use encodeTransfer
        nonce: 0
      })

      txs.push(innerTx)
    }

    const walletTx: WalletTransaction = buildMultiSendSmartAccountTx(
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

    let estimatedGasUsed = 0;
      // Check if available from current state
      const isDeployed = await this.contractUtils.isDeployed(
        chainId,
        version,
        this.address
      );
      if (!isDeployed) {
        const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
          chainId,
          version,
          owner: this.owner,
          entryPointAddress: this.entryPointAddress,
          fallbackHandlerAddress: this.fallBackHandlerAddress
        })
        console.log('estimateWalletDeployment ', estimateWalletDeployment);

        estimatedGasUsed += estimateWalletDeployment;
      }

      const tx = await this.createTransaction({ version, transaction, batchId, chainId });

      const txn: ExecTransaction = {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        operation: tx.operation,
        targetTxGas: tx.targetTxGas
      }

      // to avoid failing eth_call override with undeployed wallet
      txn.targetTxGas = 500000;
  
      const refundInfo: FeeRefundV1_0_1 = {
        baseGas: tx.baseGas,
        gasPrice: tx.gasPrice,
        tokenGasPriceFactor: tx.tokenGasPriceFactor,
        gasToken: tx.gasToken,
        refundReceiver: tx.refundReceiver
      }

      const estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto = {
        chainId,
        version,
        transaction: txn,
        walletAddress: this.address,
        feeRefund: refundInfo,
        signature: FAKE_SIGNATURE
      }

      const ethCallOverrideResponse = await this.nodeClient.estimateUndeployedContractGas(estimateUndeployedContractGasDto);
      let noAuthEstimate = Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas);
      console.log('no auth no refund estimate', noAuthEstimate);

      estimatedGasUsed += noAuthEstimate;

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
      chainId
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

  async estimateTransactionBatch( prepareRefundTransactionsDto: PrepareRefundTransactionsDto): Promise<number> {

    const { transactions, batchId, chainId, version } = prepareRefundTransactionsDto
      let estimatedGasUsed = 0;
      // Check if available from current state
      const isDeployed = await this.contractUtils.isDeployed(chainId, version, this.address);
      if (!isDeployed) {
        const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
          chainId,
          version,
          owner: this.owner,
          entryPointAddress: this.entryPointAddress,
          fallbackHandlerAddress: this.fallBackHandlerAddress
        });
        console.log('estimateWalletDeployment ', estimateWalletDeployment);
        estimatedGasUsed += estimateWalletDeployment;
      }

      const tx = await this.createTransactionBatch({ version, transactions, batchId, chainId});

      const txn: ExecTransaction = {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        operation: tx.operation,
        targetTxGas: tx.targetTxGas
      }

      // to avoid failing eth_call override with undeployed wallet
      txn.targetTxGas = 500000;
  
      const refundInfo: FeeRefundV1_0_1 = {
        baseGas: tx.baseGas,
        gasPrice: tx.gasPrice,
        tokenGasPriceFactor: tx.tokenGasPriceFactor,
        gasToken: tx.gasToken,
        refundReceiver: tx.refundReceiver
      }

      const estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto = {
        chainId,
        version,
        transaction: txn,
        walletAddress: this.address,
        feeRefund: refundInfo,
        signature: FAKE_SIGNATURE
      }

      const ethCallOverrideResponse = await this.nodeClient.estimateUndeployedContractGas(estimateUndeployedContractGasDto);
      let noAuthEstimate = Number(ethCallOverrideResponse.data.gas) + Number(ethCallOverrideResponse.data.txBaseGas);
      console.log('no auth no refund estimate', noAuthEstimate);

      estimatedGasUsed += noAuthEstimate;

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
    const estimatedGasUsed: number = await this.estimateTransactionBatch({
      version,
      transactions,
      batchId,
      chainId
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
    const { chainId, version, owner, entryPointAddress, fallbackHandlerAddress }  = estimateSmartAccountDeploymentDto
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
        const deployCostresponse = await this.nodeClient.estimateExternalGas({chainId, encodedData:encodedEstimateData});
        const estimateWalletDeployment = Number(deployCostresponse.data.gas);
        console.log('estimateWalletDeployment ', estimateWalletDeployment);
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
    walletContract = walletContract.attach(this.address)

    let additionalBaseGas = 0

    // NOTE : If the wallet is not deployed yet then nonce would be zero
    let nonce = 0
    const isDeployed = await this.contractUtils.isDeployed(chainId, version, this.address)
    if (isDeployed) {
      nonce = (await walletContract.getNonce(batchId)).toNumber()
    } else {
      const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
        chainId,
        version,
        owner: this.owner,
        entryPointAddress: this.entryPointAddress,
        fallbackHandlerAddress: this.fallBackHandlerAddress
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
        chainId,
        walletAddress: this.address,
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
        chainId,
        version: version,
        walletAddress: this.address,
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
        chainId,
        walletAddress: this.address,
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
        chainId,
        version: version,
        walletAddress: this.address,
        feeRefund: refundDetails
      }
      const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGas(estimateHandlePaymentGas)
      handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

      console.log('handlePaymentEstimate ', handlePaymentEstimate)

      baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas // delegate call + event emission + state updates + potential deployment
    }

    const walletTx: WalletTransaction = buildSmartAccountTransaction({
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
      const connectedWallet = this.address
      walletContract = walletContract.attach(connectedWallet)
  
      const isDeployed = await this.contractUtils.isDeployed(chainId, version, this.address);
      let additionalBaseGas = 0;
  
      // NOTE : If the wallet is not deployed yet then nonce would be zero
      let nonce = 0
      if (isDeployed) {
        nonce = (await walletContract.getNonce(batchId)).toNumber()
      } else {
        // TODO : estimation cost can be passed
        const estimateWalletDeployment = await this.estimateSmartAccountDeployment({
          chainId,
          version,
          owner: this.owner,
          entryPointAddress: this.entryPointAddress,
          fallbackHandlerAddress: this.fallBackHandlerAddress
        })
        // We know it's going to get deployed by Relayer but we handle refund cost here..
        console.log('estimateWalletDeployment ', estimateWalletDeployment)
  
        // We know it's going to get deployed by Relayer
        // but we handle refund cost here..
        additionalBaseGas += estimateWalletDeployment // wallet deployment gas
      }
      console.log('nonce: ', nonce)
  
      const txs: MetaTransaction[] = []
  
      for (let i = 0; i < transactions.length; i++) {
        const innerTx: WalletTransaction = buildSmartAccountTransaction({
          to: transactions[i].to,
          value: transactions[i].value,
          data: transactions[i].data, // for token transfers use encodeTransfer
          nonce: 0
        })
  
        txs.push(innerTx)
      }
  
      const walletTx: WalletTransaction = buildMultiSendSmartAccountTx(
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
      
      let targetTxGas, baseGas, handlePaymentEstimate;
      const regularOffSet = GAS_USAGE_OFFSET;
  
      if(!isDeployed){
        // Regular APIs will return 0 for handlePayment and requiredTxGas for undeployed wallet
        // targetTxGas?
        // i. use really high value 
        // ii. estimate using different wallet bytecode using eth_call [ not guaranteed as might depend on wallet state !]
        const estimateRequiredTxGas: EstimateRequiredTxGasDto = {
          chainId,
          walletAddress: this.address,
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
          chainId,
          version: version,
          walletAddress: this.address,
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
          chainId,
          walletAddress: this.address,
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
          chainId,
          version: version,
          walletAddress: this.address,
          feeRefund: refundDetails
        }
        const handlePaymentResponse = await this.nodeClient.estimateHandlePaymentGas(estimateHandlePaymentGas)
        let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)
        console.log('handlePaymentEstimate ', handlePaymentEstimate);
        baseGas = handlePaymentEstimate + regularOffSet + additionalBaseGas; // delegate call + event emission + state updates + potential deployment
      }
  
      const finalWalletTx: WalletTransaction = buildSmartAccountTransaction({
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

  async getAddress(
    addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
  ): Promise<string> {
    // TODO: Get from node client first from cache, if not found then query smart contract
    // we will hit smart account endpoint to fetch deployed smart account info
    const address = await this.getAddressForCounterfactualWallet(addressForCounterFactualWalletDto)
    console.log('address is ', address);
    
    this.address = address
    return address
  }

  /**
   * @param address Owner aka {EOA} address
   * @param index number of smart account deploy i.e {0, 1 ,2 ...}
   * @description return address for Smart account
   * @returns
  
  */
  // TODO: hit the api before getting data from smart contract
  async getAddressForCounterfactualWallet(
    addressForCounterFactualWalletDto: AddressForCounterFactualWalletDto
  ): Promise<string> {
    const { index, chainId, version } = addressForCounterFactualWalletDto
    console.log('index and ChainId ', index, chainId, version)
    return this.contractUtils.smartWalletFactoryContract[chainId][
      version
    ].getAddressForCounterfactualWallet(this.owner, index)
  }

  ethersAdapter(chainId: ChainId): EthersAdapter {
    return this.contractUtils.ethAdapter[chainId]
  }
}
const DefaultConfig: Config = {
  owner: '',
  version: '1.0.1',
  activeNetworkId: ChainId.GOERLI, //Update later
  supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  backend_url: 'https://sdk-backend.staging.biconomy.io/v1'
}

export default Transaction