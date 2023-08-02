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
import { Overrides, InitilizationData } from '../utils/Types'
import { BigNumberish, BytesLike } from 'ethers'
import { ISmartAccount } from './ISmartAccount'
import { Signer } from 'ethers'

export interface IBiconomySmartAccount extends ISmartAccount {
  init(initilizationData?: InitilizationData): Promise<this>
  initializeAccountAtIndex(accountIndex: number): void
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
  attachSigner(signer: Signer): Promise<void>
}
