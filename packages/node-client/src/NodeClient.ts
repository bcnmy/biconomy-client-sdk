import INodeClient from './INodeClient'
import {
  EstimateExternalGasDto,
  EstimateRequiredTxGasDto,
  EstimateHandlePaymentTxGasDto,
  SmartAccountByOwnerDto,
  TokenByChainIdAndAddressDto,
  TokenPriceResponse,
  SupportedChainsResponse,
  individualChainResponse,
  SupportedTokensResponse,
  IndividualTokenResponse,
  SmartAccountsResponse,
  BalancesDto,
  BalancesResponse,
  UsdBalanceResponse,
  EstimateGasResponse
} from './types/NodeClientTypes'
import { getTxServiceBaseUrl } from './utils'
import { HttpMethod, sendRequest } from './utils/httpRequests'
export interface NodeClientConfig {
  /** txServiceUrl - Safe Transaction Service URL */
  txServiceUrl: string
  /** ethAdapter - Ethereum adapter */
  // ethAdapter: EthAdapter
}

class NodeClient implements INodeClient {
  #txServiceBaseUrl: string
  // #ethAdapter: EthAdapter

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
  async getChainById(chainId: number): Promise<individualChainResponse> {
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

  // async estimateUndeployedContractGas(chainId: number, walletAddress: string, transaction: MetaTransactionData, feeRefund: FeeRefund, signature:string): Promise<EstimateGasResponse> {
  //   return sendRequest({
  //     url: `${this.#txServiceBaseUrl}/estimator/undeployed`,
  //     method: HttpMethod.Post,
  //     body: {
  //       chainId,
  //       walletAddress,
  //       transaction,
  //       feeRefund,
  //       signature
  //     }
  //   })
  // }
}

export default NodeClient
