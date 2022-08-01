import { Signer } from '@ethersproject/abstract-signer'
import {
  TokenPriceResponse,
  SupportedChainsResponse,
  individualChainResponse,
  SupportedTokensResponse,
  IndividualTokenResponse,
  SmartAccountsResponse,
  BalancesRespose,
  BalancesDto,
  UsdBalanceResponse
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

  getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesRespose>

  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>
}

export default INodeClient
