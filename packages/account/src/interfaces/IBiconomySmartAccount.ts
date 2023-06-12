import { UserOperation, Transaction } from '@biconomy/core-types'
import {
  SupportedChainsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  SmartAccountByOwnerDto,
  SmartAccountsResponse,
  SCWTransactionResponse
} from '@biconomy/node-client'
import { Overrides } from '../utils/Types'
import { BigNumberish, BytesLike } from 'ethers'

export interface IBiconomySmartAccount {
  setAccountIndex(accountIndex: number): void
  getExecuteCallData(to: string, value: BigNumberish, data: BytesLike): string
  getExecuteBatchCallData(
    to: Array<string>,
    value: Array<BigNumberish>,
    data: Array<BytesLike>
  ): string
  buildUserOp(transactions: Transaction[], overrides?: Overrides): Promise<Partial<UserOperation>>
  getAllTokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>
  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>
  getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse>
  getTransactionsByAddress(chainId: number, address: string): Promise<SCWTransactionResponse[]>
  getTransactionByHash(txHash: string): Promise<SCWTransactionResponse>
  getAllSupportedChains(): Promise<SupportedChainsResponse>
}
