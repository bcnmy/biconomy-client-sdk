import { FeeRefundData, MetaTransactionData } from '@biconomy-sdk/core-types'
import { Signer } from '@ethersproject/abstract-signer'
import {
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
    chainId: number,
    tokenAddress: string
  ): Promise<IndividualTokenResponse>

  // Smart Account Endpoints

  getSmartAccountsByOwner(chainId: number, owner: string): Promise<SmartAccountsResponse>

  getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>

  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>

  estimateExternalGas(chainId: number, encodedData: string): Promise<EstimateGasResponse>

  estimateRequiredTxGas(chainId: number, estimatorAddress: string, transaction: MetaTransactionData): Promise<EstimateGasResponse>

  estimateHandlePaymentGas(chainId: number, estimatorAddress: string, feeRefund: FeeRefundData): Promise<EstimateGasResponse>
}

export default INodeClient
