// import { FeeRefund, FeeRefundData, MetaTransactionData } from '@biconomy-devx/core-types'
import {
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
  SCWTransactionResponse,
  WhiteListSignatureResponse
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
  getAllTokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>

  /**
   *
   * @param balancesDto Get total USD balance
   */
  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>

  /**
   *
   * @param origin
   * About: Whitelist domain by passing the origin domain
   * Purpose: Returns the signature used in init
   */
  whitelistUrl(origin: string): Promise<WhiteListSignatureResponse>

  getTransactionByHash(txHash: string): Promise<SCWTransactionResponse>

  getTransactionByAddress(chainId: number, address: string): Promise<SCWTransactionResponse[]>
}

export default INodeClient
