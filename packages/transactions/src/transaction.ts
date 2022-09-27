import { smartAccountSignMessage } from 'execution'
import {
  TransactionDto,
  TransactionBatchDto,
  MetaTransaction,
  MetaTransactionData,
  RefundTransactionDto,
  WalletTransaction,
  Config,
  OperationType,
  ZERO_ADDRESS,
  ChainId,
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

  async getContractUtilInstance(): Promise<ContractUtils>{
    return this.contractUtils
  }

  async getNodeClient(): Promise<NodeClient>{
    return this.nodeClient
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
        entryPointAddress: '',
        fallbackHandlerAddress: ''
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
      let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

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
      let handlePaymentEstimate = Number(handlePaymentResponse.data.gas)

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