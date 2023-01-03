import INodeClient from './INodeClient'
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
  BalancesDto,
  BalancesResponse,
  UsdBalanceResponse,
  EstimateGasResponse,
  SCWTransactionResponse,
  WhiteListSignatureResponse,
  IsFallbackEnabledResponse
} from './types/NodeClientTypes'
import { getTxServiceBaseUrl } from './utils'
import { HttpMethod, sendRequest } from './utils/HttpRequests'
export interface NodeClientConfig {
  /** txServiceUrl - Safe Transaction Service URL */
  txServiceUrl: string
}

class NodeClient implements INodeClient {
  #txServiceBaseUrl: string

  // Review
  // Removed ethAdapter
  constructor({ txServiceUrl }: NodeClientConfig) {
    this.#txServiceBaseUrl = getTxServiceBaseUrl(txServiceUrl)
    // this.#ethAdapter = ethAdapter
  }

  /**
   * Returns the list of supported chains and their configurations
   *
   * @returns The list of Network info
   */
  async getAllSupportedChains(): Promise<SupportedChainsResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/chains/`,
      method: HttpMethod.Get
    })
  }
  /**
   *
   * @param chainId
   * @description thie function will return the chain detail base on supplied { chainId }
   * @returns
   */
  async getChainById(chainId: number): Promise<IndividualChainResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/chains/${chainId}`,
      method: HttpMethod.Get
    })
  }

  /**
   *
   * @param chainId
   * @description this function will return token price base on supplied {chainId}
   * @returns
   */
  async getTokenPricesByChainId(chainId: number): Promise<TokenPriceResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/chains/chainId/${chainId}/price`,
      method: HttpMethod.Get
    })
  }

  async getAllTokens(): Promise<SupportedTokensResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/`,
      method: HttpMethod.Get
    })
  }

  async getTokensByChainId(chainId: number): Promise<SupportedTokensResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/chainId/${chainId}`,
      method: HttpMethod.Get
    })
  }

  async getTokenByChainIdAndAddress(
    tokenByChainIdAndAddressDto: TokenByChainIdAndAddressDto
  ): Promise<IndividualTokenResponse> {
    const { chainId, tokenAddress } = tokenByChainIdAndAddressDto
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/chainId/${chainId}/address/${tokenAddress}`,
      method: HttpMethod.Get
    })
  }

  async getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse> {
    const { chainId, owner } = smartAccountByOwnerDto
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/smart-accounts/chainId/${chainId}/owner/${owner}`,
      method: HttpMethod.Get
    })
  }

  async getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/smart-accounts/balances`,
      method: HttpMethod.Post,
      body: balancesDto
    })
  }

  async getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/smart-accounts/balance`,
      method: HttpMethod.Post,
      body: balancesDto
    })
  }

  /**
   *
   * @param origin
   * @description this function will return the signature for your domain
   * @returns
   */
  async whitelistUrl(origin: string): Promise<WhiteListSignatureResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/whitelist`,
      method: HttpMethod.Post,
      body: {
        origin
      }
    })
  }

  async isFallbackEnabled(): Promise<IsFallbackEnabledResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/gasless-fallback-flag`,
      method: HttpMethod.Get
    })
  }

  async estimateExternalGas(
    estimateExternalGasDto: EstimateExternalGasDto
  ): Promise<EstimateGasResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/estimator/external`,
      method: HttpMethod.Post,
      body: estimateExternalGasDto
    })
  }
  async estimateRequiredTxGas(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/estimator/required`,
      method: HttpMethod.Post,
      body: estimateRequiredTxGasDto
    })
  }

  estimateHandlePaymentGas(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/estimator/handle-payment`,
      method: HttpMethod.Post,
      body: estimateHandlePaymentTxGasDto
    })
  }

  async estimateRequiredTxGasOverride(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/estimator/required-override`,
      method: HttpMethod.Post,
      body: estimateRequiredTxGasDto
    })
  }

  async estimateHandlePaymentGasOverride(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/estimator/handle-payment-override`,
      method: HttpMethod.Post,
      body: estimateHandlePaymentTxGasDto
    })
  }

  async estimateUndeployedContractGas(
    estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto
  ): Promise<EstimateGasResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/estimator/undeployed`,
      method: HttpMethod.Post,
      body: estimateUndeployedContractGasDto
    })
  }

  getTransactionByAddress(chainId: number, address: string): Promise<SCWTransactionResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/transactions/chainId/${chainId}/address/${address}`,
      method: HttpMethod.Get
    })
  }

  getTransactionByHash(txHash: string): Promise<SCWTransactionResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/transactions/txHash/${txHash}`,
      method: HttpMethod.Get
    })
  }
}

export default NodeClient
