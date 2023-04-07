import { Contract, Wallet, utils, BigNumberish, Signer, PopulatedTransaction } from 'ethers'

import {
  ChainId,
  ExecTransaction,
  IFeeRefundV1_0_0,
  IFeeRefundV1_0_1,
  IWalletTransaction,
  SmartAccountSignature
} from '@biconomy-devx/core-types'

import { TypedDataSigner } from '@ethersproject/abstract-signer'
import { AddressZero } from '@ethersproject/constants'

export const EIP_DOMAIN = {
  EIP712Domain: [
    { type: 'uint256', name: 'chainId' },
    { type: 'address', name: 'verifyingContract' }
  ]
}

export const EIP712_ACCOUNT_TX_TYPE = {
  // "AccountTx(address to,uint256 value,bytes data,uint8 operation,uint256 targetTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
  AccountTx: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'value' },
    { type: 'bytes', name: 'data' },
    { type: 'uint8', name: 'operation' },
    { type: 'uint256', name: 'targetTxGas' },
    { type: 'uint256', name: 'baseGas' },
    { type: 'uint256', name: 'gasPrice' },
    { type: 'uint256', name: 'tokenGasPriceFactor' },
    { type: 'address', name: 'gasToken' },
    { type: 'address', name: 'refundReceiver' },
    { type: 'uint256', name: 'nonce' }
  ]
}

export const EIP712_SMART_ACCOUNT_MESSAGE_TYPE = {
  // "SmartAccountMessage(bytes message)"
  SmartAccountMessage: [{ type: 'bytes', name: 'message' }]
}

export const calculateSmartAccountDomainSeparator = (
  wallet: Contract,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.hashDomain({
    verifyingContract: wallet.address,
    chainId
  })
}

export const preimageWalletTransactionHash = (
  wallet: Contract,
  SmartAccountTx: IWalletTransaction,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.encode(
    { verifyingContract: wallet.address, chainId },
    EIP712_ACCOUNT_TX_TYPE,
    SmartAccountTx
  )
}

export const calculateSmartAccountTransactionHash = (
  wallet: Contract,
  SmartAccountTx: IWalletTransaction,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.hash(
    { verifyingContract: wallet.address, chainId },
    EIP712_ACCOUNT_TX_TYPE,
    SmartAccountTx
  )
}

export const calculateSmartAccountMessageHash = (
  wallet: Contract,
  message: string,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.hash(
    { verifyingContract: wallet.address, chainId },
    EIP712_SMART_ACCOUNT_MESSAGE_TYPE,
    { message }
  )
}

export const smartAccountSignTypedData = async (
  signer: Signer,
  wallet: Contract,
  SmartAccountTx: IWalletTransaction,
  chainId?: BigNumberish
): Promise<SmartAccountSignature> => {
  if (!chainId && !signer?.provider) throw Error('Provider required to retrieve chainId')
  /* eslint-disable  @typescript-eslint/no-non-null-assertion */
  const cid = chainId ?? (await signer.provider!.getNetwork())?.chainId
  const signerAddress = await signer.getAddress()
  return {
    signer: signerAddress,
    data: await (signer as Signer & TypedDataSigner)._signTypedData(
      { verifyingContract: wallet.address, chainId: cid },
      EIP712_ACCOUNT_TX_TYPE,
      SmartAccountTx
    )
  }
}

export const signHash = async (signer: Signer, hash: string): Promise<SmartAccountSignature> => {
  const typedDataHash = utils.arrayify(hash)
  const signerAddress = await signer.getAddress()
  return {
    signer: signerAddress,
    data: (await signer.signMessage(typedDataHash)).replace(/1b$/, '1f').replace(/1c$/, '20')
  }
}

export const smartAccountSignMessage = async (
  signer: Signer,
  wallet: Contract,
  SmartAccountTx: IWalletTransaction,
  chainId: ChainId
): Promise<SmartAccountSignature> => {
  if (!chainId && !signer?.provider) throw Error('Provider required to retrieve chainId')
  const cid = chainId ?? (await signer.provider!.getNetwork()).chainId
  if (!cid) {
    throw Error('smartAccountSignMessage: Chain Id Not Found')
  }
  return signHash(signer, calculateSmartAccountTransactionHash(wallet, SmartAccountTx, cid))
}

export const buildSignatureBytes = (signatures: SmartAccountSignature[]): string => {
  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  )
  let signatureBytes = '0x'
  for (const sig of signatures) {
    signatureBytes += sig.data.slice(2)
  }
  return signatureBytes
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const executeTx = async (
  wallet: Contract,
  SmartAccountTx: IWalletTransaction,
  signatures: SmartAccountSignature[],
  overrides?: any
): Promise<any> => {
  const signatureBytes = buildSignatureBytes(signatures)
  const transaction: ExecTransaction = {
    to: SmartAccountTx.to,
    value: SmartAccountTx.value,
    data: SmartAccountTx.data,
    operation: SmartAccountTx.operation,
    targetTxGas: SmartAccountTx.targetTxGas
  }
  const refundInfo: IFeeRefundV1_0_0 | IFeeRefundV1_0_1 = {
    baseGas: SmartAccountTx.baseGas,
    gasPrice: SmartAccountTx.gasPrice,
    tokenGasPriceFactor: SmartAccountTx.tokenGasPriceFactor,
    gasToken: SmartAccountTx.gasToken,
    refundReceiver: SmartAccountTx.refundReceiver
  }
  return wallet.execTransaction(transaction, refundInfo, signatureBytes, overrides || {})
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const populateExecuteTx = async (
  wallet: Contract,
  SmartAccountTx: IWalletTransaction,
  signatures: SmartAccountSignature[],
  overrides?: any
): Promise<PopulatedTransaction> => {
  const signatureBytes = buildSignatureBytes(signatures)
  const transaction: ExecTransaction = {
    to: SmartAccountTx.to,
    value: SmartAccountTx.value,
    data: SmartAccountTx.data,
    operation: SmartAccountTx.operation,
    targetTxGas: SmartAccountTx.targetTxGas
  }
  const refundInfo: IFeeRefundV1_0_0 | IFeeRefundV1_0_1 = {
    baseGas: SmartAccountTx.baseGas,
    gasPrice: SmartAccountTx.gasPrice,
    tokenGasPriceFactor: SmartAccountTx.tokenGasPriceFactor,
    gasToken: SmartAccountTx.gasToken,
    refundReceiver: SmartAccountTx.refundReceiver
  }
  return wallet.populateTransaction.execTransaction(
    transaction,
    refundInfo,
    signatureBytes,
    overrides || {}
  )
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export const buildContractCall = (
  contract: Contract,
  method: string,
  params: any[],
  nonce: number,
  delegateCall?: boolean,
  overrides?: Partial<IWalletTransaction>
): IWalletTransaction => {
  const data = contract.interface.encodeFunctionData(method, params)
  return buildSmartAccountTransaction(
    Object.assign(
      {
        to: contract.address,
        data,
        operation: delegateCall ? 1 : 0,
        nonce
      },
      overrides
    )
  )
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const executeTxWithSigners = async (
  wallet: Contract,
  tx: IWalletTransaction,
  signers: Wallet[],
  overrides?: any
) => {
  const sigs = await Promise.all(
    signers.map((signer) => smartAccountSignTypedData(signer, wallet, tx))
  )
  return executeTx(wallet, tx, sigs, overrides)
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export const executeContractCallWithSigners = async (
  wallet: Contract,
  contract: Contract,
  method: string,
  params: any[],
  signers: Wallet[],
  delegateCall?: boolean,
  overrides?: Partial<IWalletTransaction>
) => {
  const tx = buildContractCall(
    contract,
    method,
    params,
    await wallet.getNonce(0), //default batchId @review
    delegateCall,
    overrides
  )
  return executeTxWithSigners(wallet, tx, signers)
}

export const buildSmartAccountTransaction = (template: {
  to: string
  value?: BigNumberish
  data?: string
  operation?: number
  targetTxGas?: number | string
  baseGas?: number | string
  gasPrice?: number | string
  tokenGasPriceFactor?: number | string
  gasToken?: string
  refundReceiver?: string
  nonce: number
}): IWalletTransaction => {
  return {
    to: template.to,
    value: template.value || 0,
    data: template.data || '0x',
    operation: template.operation || 0,
    targetTxGas: template.targetTxGas || 0,
    baseGas: template.baseGas || 0,
    gasPrice: template.gasPrice || 0,
    tokenGasPriceFactor: template.tokenGasPriceFactor || 1,
    gasToken: template.gasToken || AddressZero,
    refundReceiver: template.refundReceiver || AddressZero,
    nonce: template.nonce
  }
}
