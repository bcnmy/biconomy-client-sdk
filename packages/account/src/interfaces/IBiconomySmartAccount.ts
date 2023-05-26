import { UserOperation, Transaction} from "@biconomy/core-types"
import { SupportedChainsResponse, BalancesResponse, BalancesDto, UsdBalanceResponse, SmartAccountByOwnerDto, SmartAccountsResponse, SCWTransactionResponse } from "@biconomy/node-client"

export interface IBiconomySmartAccount {
    buildUserOp(transactions: Transaction[]): Promise<UserOperation>
    getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse>
    getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse>
    getSmartAccountsByOwner(
        smartAccountByOwnerDto: SmartAccountByOwnerDto
      ): Promise<SmartAccountsResponse>
    getTransactionByAddress(
        chainId: number,
        address: string
      ): Promise<SCWTransactionResponse[]>
    getTransactionByHash(txHash: string): Promise<SCWTransactionResponse>
    getAllSupportedChains(): Promise<SupportedChainsResponse>
}