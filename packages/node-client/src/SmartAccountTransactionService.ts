import { Signer } from '@ethersproject/abstract-signer'
import {
  MasterCopyResponse,
  OwnerResponse,
  ProposeTransactionProps,
  SafeBalanceResponse,
  SafeBalancesOptions,
  SafeBalancesUsdOptions,
  SafeBalanceUsdResponse,
  SafeCollectibleResponse,
  SafeCollectiblesOptions,
  SmartAccountCreationInfoResponse,
  SmartAccountDelegate,
  SmartAccountDelegateConfig,
  SmartAccountDelegateDeleteConfig,
  SafeDelegateListResponse,
  SafeInfoResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse,
  SmartAccountInfoResponse,
  SignatureResponse,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from './types/smartAccountTransactionServiceTypes'

interface SmartAccountTransactionService {
  // About
  getServiceInfo(): Promise<SmartAccountInfoResponse>
  getServiceMasterCopiesInfo(): Promise<MasterCopyResponse[]>

  // Data decoder
  decodeData(data: string): Promise<any>

  // Owners
  getSafesByOwner(ownerAddress: string): Promise<OwnerResponse>

  // Multisig transactions
  getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse>
  getTransactionConfirmations(safeTxHash: string): Promise<SafeMultisigConfirmationListResponse>
  confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse>

  // Safes
  getSafeInfo(safeAddress: string): Promise<SafeInfoResponse>
  getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse>
  addSafeDelegate(config: SmartAccountDelegateConfig): Promise<SmartAccountDelegate>
  removeSafeDelegate(config: SmartAccountDelegateDeleteConfig): Promise<void>
  removeAllSafeDelegates(safeAddress: string, signer: Signer): Promise<void>

  // Transactions
  getSafeCreationInfo(safeAddress: string): Promise<SmartAccountCreationInfoResponse>
  estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse>
  proposeTransaction({
    safeAddress,
    senderAddress,
    safeTransaction,
    safeTxHash,
    origin
  }: ProposeTransactionProps): Promise<void>
  getIncomingTransactions(safeAddress: string): Promise<TransferListResponse>
  getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse>
  getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse>
  getPendingTransactions(
    safeAddress: string,
    currentNonce?: number
  ): Promise<SafeMultisigTransactionListResponse>
  getNextNonce(safeAddress: string): Promise<number>

  // Balances
  getBalances(safeAddress: string, options?: SafeBalancesOptions): Promise<SafeBalanceResponse[]>
  getUsdBalances(
    safeAddress: string,
    options?: SafeBalancesUsdOptions
  ): Promise<SafeBalanceUsdResponse[]>
  getCollectibles(
    safeAddress: string,
    options?: SafeCollectiblesOptions
  ): Promise<SafeCollectibleResponse[]>

  // Tokens
  getTokenList(): Promise<TokenInfoListResponse>
  getToken(tokenAddress: string): Promise<TokenInfoResponse>
}

export default SmartAccountTransactionService
