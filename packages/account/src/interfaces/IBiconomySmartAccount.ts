import { UserOperation, Transaction } from '@biconomy/core-types'
import { UserOpResponse } from '@biconomy/bundler'
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
import { IBaseSmartAccount } from './IBaseSmartAccount'

export interface IBiconomySmartAccount extends IBaseSmartAccount {
  init(initilizationData?: InitilizationData): Promise<this>
  encodeExecute(to: string, value: BigNumberish, data: BytesLike): Promise<string>
  encodeExecuteBatch(
    to: Array<string>,
    value: Array<BigNumberish>,
    data: Array<BytesLike>
  ): Promise<string>
  buildUserOp(transactions: Transaction[], overrides?: Overrides): Promise<Partial<UserOperation>>
  sendUserOp(userOperation: UserOperation): Promise<UserOpResponse>
  sendSignedUserOp(userOperation: UserOperation): Promise<UserOpResponse>

  // Note: May not be necessary
  initializeAccountAtIndex(accountIndex: number): void

  // Review: Consider adding and implementing
  // getFactoryAddress(): Promise<string>
  // getFactoryAccountInitCode(): Promise<string>

  getAllTokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>
  getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>
  getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse>
  getTransactionsByAddress(chainId: number, address: string): Promise<SCWTransactionResponse[]>
  getTransactionByHash(txHash: string): Promise<SCWTransactionResponse>
  getAllSupportedChains(): Promise<SupportedChainsResponse>
}
