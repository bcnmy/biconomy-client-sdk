// import { FeeRefund, FeeRefundData, MetaTransactionData } from '@biconomy-sdk/core-types'
import { Signer } from '@ethersproject/abstract-signer'
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
  EstimateGasResponse
} from './types/NodeClientTypes'

interface INodeClient {
  // Chain Apis
  getAllSupportedChains(): Promise<SupportedChainsResponse>

  getChainById(chainId: number): Promise<IndividualChainResponse>

  getTokenPricesByChainId(chainId: number): Promise<TokenPriceResponse>

  // Tokens Endpoint

  getAllTokens(): Promise<SupportedTokensResponse>
  getTokensByChainId(chainId: number): Promise<SupportedTokensResponse>
  getTokenByChainIdAndAddress(
    tokenByChainIdAndAddressDto: TokenByChainIdAndAddressDto
  ): Promise<IndividualTokenResponse>

  // Smart Account Endpoints

  getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse>

  getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>

  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>

  estimateExternalGas(estimateExternalGasDto: EstimateExternalGasDto): Promise<EstimateGasResponse>

  // TODO
  // Comment usage 

  estimateRequiredTxGas(
    estimateRequiredTxGasDto: EstimateRequiredTxGasDto
  ): Promise<EstimateGasResponse>

  estimateRequiredTxGasOverride(estimateRequiredTxGasDto: EstimateRequiredTxGasDto): Promise<EstimateGasResponse>

  estimateHandlePaymentGas(
    estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto
  ): Promise<EstimateGasResponse>

  estimateHandlePaymentGasOverride(estimateHandlePaymentTxGasDto: EstimateHandlePaymentTxGasDto): Promise<EstimateGasResponse>

  estimateUndeployedContractGas(
    estimateUndeployedContractGasDto: EstimateUndeployedContractGasDto
  ): Promise<EstimateGasResponse>
}

export default INodeClient
