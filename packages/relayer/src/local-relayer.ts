import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { RawTransactionType } from '@biconomy-sdk/core-types'
import { Signer as AbstractSigner, ethers } from 'ethers'
import { Relayer } from '.'

import {
  SmartWalletFactoryContract,
  SmartWalletContract,
  MultiSendContract,
  MultiSendCallOnlyContract,
  TransactionResult,
  SmartAccountContext,
  SmartAccountState,
  SignedTransaction,
  WalletTransaction
} from '@biconomy-sdk/core-types'
import { MetaTransaction, encodeMultiSend } from './utils/multisend'

export class LocalRelayer implements Relayer {
  private signer: AbstractSigner
  // private txnOptions: TransactionRequest

  constructor(signer: AbstractSigner) {
    if (!AbstractSigner.isSigner(signer)) throw new Error('Signer must have a provider')
    this.signer = signer
    if (!this.signer.provider) throw new Error('Signer must have a provider')
  }

  // TODO
  // Review function arguments and return values
  // Could get smartAccount instance
  // Defines a type that takes config, context for SCW in play along with other details
  async deployWallet(
    config: SmartAccountState,
    context: SmartAccountContext,
    index: number = 0
  ): Promise<TransactionResponse> {
    // Should check if already deployed
    //Review for index and ownership transfer case
    const { address } = config
    const { walletFactory } = context
    const isExist = await walletFactory.isWalletExist(address)
    if (isExist) {
      throw new Error('Smart Account is Already Deployed')
    }
    const walletDeployTxn = this.prepareWalletDeploy(config, context, index)
    const tx = this.signer.sendTransaction({
      ...walletDeployTxn,
      gasLimit: ethers.constants.Two.pow(24)
    })
    return tx
  }

  prepareWalletDeploy(
    // owner, entryPoint, handler, index
    config: SmartAccountState,
    context: SmartAccountContext,
    index: number = 0
    // context: WalletContext
  ): { to: string; data: string } {
    const { walletFactory } = context
    const { owner, entryPointAddress, fallbackHandlerAddress } = config
    const factoryInterface = walletFactory.getInterface()

    return {
      to: walletFactory.getAddress(), // from context
      data: factoryInterface.encodeFunctionData(
        factoryInterface.getFunction('deployCounterFactualWallet'),
        [owner, entryPointAddress, fallbackHandlerAddress, index]
      )
    }
  }

  /*async isWalletDeployed(walletAddress: string): Promise<boolean> {
      // Check if wallet is deployed
      return true;
    }*/

  /*async getFeeOptions(
    ): Promise<{ options: FeeOption[] }> {
      return { options: [] }
    }*/

  /*async gasRefundOptions( 
    ): Promise<FeeOption[]> {
      const { options } = //await this.getFeeOptions()
      return options
    }*/

  // Should make an object that takes config and context
  // Add feeQuote later
  // Appending tx and rawTx may not be necessary

  async relay(
    signedTx: SignedTransaction,
    config: SmartAccountState,
    context: SmartAccountContext
  ): Promise<TransactionResponse> {
    const { isDeployed, address } = config
    const { multiSendCall } = context // multisend has to be multiSendCallOnly here!
    if (!isDeployed) {
      // If not =>> preprendWalletDeploy
      console.log('here')
      const { to, data } = this.prepareWalletDeploy(config, context)
      const originalTx: WalletTransaction = signedTx.tx

      const txs: MetaTransaction[] = [
        {
          to,
          value: 0,
          data,
          operation: 0
        },
        {
          to: address,
          value: 0,
          data: signedTx.rawTx.data || '',
          operation: 0
        }
      ]

      const txnData = multiSendCall
        .getInterface()
        .encodeFunctionData('multiSend', [encodeMultiSend(txs)])
      console

      const finalRawRx = {
        to: multiSendCall.getAddress(),
        data: txnData
      }
      console.log('finaRawTx')
      console.log(finalRawRx)

      const tx = this.signer.sendTransaction({
        ...finalRawRx,
        gasLimit: ethers.constants.Two.pow(24)
      })
      return tx
      // rawTx to becomes multiSend address and data gets prepared again
    }

    const tx = this.signer.sendTransaction({
      ...signedTx.rawTx,
      gasLimit: ethers.constants.Two.pow(24)
    })
    return tx
  }
}
