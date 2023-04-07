// import { FeeRefund, FeeRefundData, MetaTransactionData } from '@biconomy-devx/core-types'
import {
  EstimateExternalGasDto,
  EstimateRequiredTxGasDto,
  EstimateHandlePaymentTxGasDto,
  EstimateUndeployedContractGasDto,
  SmartAccountByOwnerDto,
  TokenByChainIdAndAddressDto,
  TokenPriceResponse,
  SupportedChainsResponse,
  IndividualChainResponse,
  SupportedTokensResponse,
  IndividualTokenResponse,
  SmartAccountsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  EstimateGasResponse,
  SCWTransactionResponse,
  WhiteListSignatureResponse,
  IsFallbackEnabledResponse
} from './types/NodeClientTypes'

interface INodeClient {
  // 1. Chain Apis

  /**
   * Get all supported chains by backend node configuration
   */
  getAllSupportedChains(): Promise<SupportedChainsResponse>

  /**
   * Get ChainConfig for requested chainId
   * @param chainId
   */
  getChainById(chainId: number): Promise<IndividualChainResponse>

  // 2. Token APIs

  /**
   * Get prices for configured tokens from backend node API
   * @param chainId
   */
  getTokenPricesByChainId(chainId: number): Promise<TokenPriceResponse>

  /**
   * Get all supported tokens
   */
  // review
  getAllTokens(): Promise<SupportedTokensResponse>

  /**
   * Get TokenInfo for requested chainId
   * @param chainId
   */
  getTokensByChainId(chainId: number): Promise<SupportedTokensResponse>

  /**
   * Get TokenInfo by address and chainId
   * @param tokenByChainIdAndAddressDto
   */
  getTokenByChainIdAndAddress(
    tokenByChainIdAndAddressDto: TokenByChainIdAndAddressDto
  ): Promise<IndividualTokenResponse>

  // 3. Smart Account Endpoints

  /**
   * Get information of all smart accounts deployed for particular eoa owner for any version and index
   * @param smartAccountByOwnerDto
   */
  getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse>

  // 4. Balances Endpoints

  /**
   * Get token balances for requested chainId and address
   * address could be EOA or SmartAccount
   * @param balancesDto
   */
  getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>

  /**
   *
   * @param balancesDto Get total USD balance
   */
  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>

  // 5. Gas Estimation Endpoints
  /**
   * About: This is generic method to estimate gas on any contract call done using GasEstimator contract
   * Can be used to estimate gas before sending final transaction.
   * @param estimateExternalGasDto
   */
  estimateExternalGas(estimateExternalGasDto: EstimateExternalGasDto): Promise<EstimateGasResponse>

  /**
   *
   * @param estimateRequiredTxGasDto
   * About: Estimating the gas for inner transaction
   * Purpose: Returns suggested value for targetTxGas
   * Uses method requiredTxGas on SmartWallet contract and captures gas result from revert string
   */
  estimateRequiredTxGas(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse>

  /**
   *
   * @param origin
   * About: Whitelist domain by passing the origin domain
   * Purpose: Returns the signature used in init
   */
  whitelistUrl(origin: string): Promise<WhiteListSignatureResponse>

  /**
   * About: Is fallback enabled in backend
   * Purpose: Returns a boolean value
   */
  isFallbackEnabled(): Promise<IsFallbackEnabledResponse>

  /**
   * About : Estimating the gas for inner transaction for undeployed wallet
   * Purpose: Returns suggested value for targetTxGas when the wallet is undeployed.
   * Uses eth_call and bytecode of SmartWalletNoAuth which has method requiredTxGas
   * @param estimateRequiredTxGasDto
   */
  estimateRequiredTxGasOverride(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse>

  /**
   *
   * @param estimateHandlePaymentTxGasDto
   * About : Estimating the gas for token refund internal transaction handlePayment
   * Purpose: Returns suggested value for handlePayment part to calculate baseGas
   */
  estimateHandlePaymentGas(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse>

  /**
   * About : Estimating the gas for token refund internal transaction handlePayment but for undeployed wallet
   * (counterfactual address should have token balance)
   * Purpose: Returns suggested value for handlePayment part to calculate baseGas
   * @param estimateHandlePaymentTxGasDto
   */
  estimateHandlePaymentGasOverride(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse>

  /**
   * About: Estimating the gas for execTransaction method on undeployed smart-wallet
   * for undeployed wallet it uses fake signature and byte code of SmartwalletNoAuth using eth_call
   * Purpose: Returns suggested value for overall transaction gas cost for undeployed wallet. Helpful for calculating fee quote
   * @param estimateUndeployedContractGasDto
   */
  estimateUndeployedContractGas(
    estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto
  ): Promise<EstimateGasResponse>

  getTransactionByHash(txHash: string): Promise<SCWTransactionResponse>

  getTransactionByAddress(chainId: number, address: string): Promise<SCWTransactionResponse[]>

  // 6. Conditional Gasless Endpoint

  // 7. Signing Service Endpoint
}

export default INodeClient
