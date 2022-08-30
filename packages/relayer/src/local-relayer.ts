import { TransactionResponse } from '@ethersproject/providers'
import { Signer as AbstractSigner, ethers } from 'ethers'
import { Relayer } from '.'

import {
  DeployWallet,
  WalletTransaction,
  FeeOptionsResponse,
  RelayTransaction,
  RelayResponse
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
  async deployWallet(deployWallet: DeployWallet): Promise<TransactionResponse> {
    // Should check if already deployed
    //Review for index and ownership transfer case
    const { config, context, index = 0 } = deployWallet
    const { address } = config
    const { walletFactory } = context
    const isExist = await walletFactory.isWalletExist(address)
    if (isExist) {
      throw new Error('Smart Account is Already Deployed')
    }
    const walletDeployTxn = this.prepareWalletDeploy({ config, context, index })
    const tx = this.signer.sendTransaction({
      ...walletDeployTxn,
      gasLimit: ethers.constants.Two.pow(24)
    })
    return tx
  }

  prepareWalletDeploy(
    deployWallet: DeployWallet
    // context: WalletContext
  ): { to: string; data: string } {
    const { config, context, index = 0 } = deployWallet

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

  async relay(relayTransaction: RelayTransaction): Promise<RelayResponse> {
    const { config, signedTx, context } = relayTransaction
    const { isDeployed, address } = config
    const { multiSendCall } = context // multisend has to be multiSendCallOnly here!
    if (!isDeployed) {
      // If not =>> preprendWalletDeploy
      console.log('here')
      const prepareWalletDeploy: DeployWallet = {
        config,
        context,
        index: 0
      }
      const { to, data } = this.prepareWalletDeploy(prepareWalletDeploy)
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

  async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
    console.log('requested fee options for chain ', chainId)
    const feeOptions: FeeOptionsResponse = {
      msg: 'all ok',
      data: {
        chainId: 5,
        response: [
          {
            tokenGasPrice: 157718,
            symbol: 'USDC',
            address: '0xb5B640E6414b6DeF4FC9B3C1EeF373925effeCcF',
            decimal: 6,
            logoUrl:
              'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png',
            offset: 1000000
          }
        ]
      }
    }
    return feeOptions
  }
}
