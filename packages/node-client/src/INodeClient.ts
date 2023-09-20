// import { FeeRefund, FeeRefundData, MetaTransactionData } from '@biconomy/core-types'
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
  WhiteListSignatureResponse,
} from "./types/NodeClientTypes";

interface INodeClient {
  // 1. Chain Apis

  /**
   * Get all supported chains by backend node configuration
   */
  getAllSupportedChains(): Promise<SupportedChainsResponse>;

  /**
   * Get ChainConfig for requested chainId
   * @param chainId
   */
  getChainById(_chainId: number): Promise<IndividualChainResponse>;

  // 2. Token APIs

  /**
   * Get prices for configured tokens from backend node API
   * @param chainId
   */
  getTokenPricesByChainId(_chainId: number): Promise<TokenPriceResponse>;

  /**
   * Get all supported tokens
   */
  getAllTokens(): Promise<SupportedTokensResponse>;

  /**
   * Get TokenInfo for requested chainId
   * @param chainId
   */
  getTokensByChainId(_chainId: number): Promise<SupportedTokensResponse>;

  /**
   * Get TokenInfo by address and chainId
   * @param tokenByChainIdAndAddressDto
   */
  getTokenByChainIdAndAddress(_tokenByChainIdAndAddressDto: TokenByChainIdAndAddressDto): Promise<IndividualTokenResponse>;

  // 3. Smart Account Endpoints

  /**
   * Get information of all smart accounts deployed for particular eoa owner for any version and index
   * @param smartAccountByOwnerDto
   */
  getSmartAccountsByOwner(_smartAccountByOwnerDto: SmartAccountByOwnerDto): Promise<SmartAccountsResponse>;

  // 4. Balances Endpoints

  /**
   * Get token balances for requested chainId and address
   * address could be EOA or SmartAccount
   * @param balancesDto
   */
  getAllTokenBalances(_balancesDto: BalancesDto): Promise<BalancesResponse>;

  /**
   *
   * @param balancesDto Get total USD balance
   */
  getTotalBalanceInUsd(_balancesDto: BalancesDto): Promise<UsdBalanceResponse>;

  /**
   *
   * @param origin
   * About: Whitelist domain by passing the origin domain
   * Purpose: Returns the signature used in init
   */
  whitelistUrl(_origin: string): Promise<WhiteListSignatureResponse>;

  getTransactionByHash(_txHash: string): Promise<SCWTransactionResponse>;

  getTransactionByAddress(_chainId: number, _address: string): Promise<SCWTransactionResponse[]>;
}

export default INodeClient;
