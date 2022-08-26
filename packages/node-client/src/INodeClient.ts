import { FeeRefund, MetaTransactionData } from '@biconomy-sdk/core-types'
import { Signer } from '@ethersproject/abstract-signer'
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
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  EstimateGasResponse
} from './types/NodeClientTypes'

interface INodeClient {
  // Chain Apis
  getAllSupportedChains(): Promise<SupportedChainsResponse>

  getChainById(chainId: number): Promise<individualChainResponse>

  getTokenPricesByChainId(chainId: number): Promise<TokenPriceResponse>

  // Tokens Endpoint

  getAllTokens(): Promise<SupportedTokensResponse>
  getTokensByChainId(chainId: number): Promise<SupportedTokensResponse>
  getTokenByChainIdAndAddress(
    tokenByChainIdAndAddressDto: TokenByChainIdAndAddressDto
  ): Promise<IndividualTokenResponse>

  // Smart Account Endpoints

  getSmartAccountsByOwner(smartAccountByOwnerDto: SmartAccountByOwnerDto): Promise<SmartAccountsResponse>

  getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>

  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>

  estimateExternalGas(estimateExternalGasDto: EstimateExternalGasDto): Promise<EstimateGasResponse>

  estimateRequiredTxGas(estimateRequiredTxGasDto: EstimateRequiredTxGasDto): Promise<EstimateGasResponse>

  estimateHandlePaymentGas(estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto): Promise<EstimateGasResponse>
}

export default INodeClient
