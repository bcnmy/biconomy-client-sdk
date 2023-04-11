import { TransactionResponse } from '@ethersproject/providers'
import { Signer as AbstractSigner, ethers } from 'ethers'
import { IRelayer } from '.'
import {
  DeployWallet,
  FeeOptionsResponse,
  RelayTransaction,
  RelayResponse,
  GasLimit
} from '@biconomy-devx/core-types'
import { Logger } from '@biconomy-devx/common'
import { MetaTransaction, encodeMultiSend } from './utils/MultiSend'
// You can configure your own signer with gas held to send out test transactions or some sponsored transactions by plugging it into SmartAccount package
// Not meant to use for production environment for transaction ordering.
export class LocalRelayer implements IRelayer {
  private signer: AbstractSigner
  // private txnOptions: TransactionRequest

  constructor(signer: AbstractSigner) {
    if (!AbstractSigner.isSigner(signer)) throw new Error('Signer must have a provider')
    this.signer = signer
    if (!this.signer.provider) throw new Error('Signer must have a provider')
  }

  // Defines a type DeployWallet that takes config, context for SCW in this context
  async deployWallet(deployWallet: DeployWallet): Promise<TransactionResponse> {
    // checkd if already deployed
    const { config, context, index = 0 } = deployWallet
    const { isDeployed } = config
    if (isDeployed) {
      throw new Error('Smart Account is Already Deployed')
    }
    const walletDeployTxn = this.prepareWalletDeploy({ config, context, index })
    const tx = this.signer.sendTransaction({
      ...walletDeployTxn,
      gasLimit: ethers.constants.Two.pow(24)
    })
    return tx
  }

  prepareWalletDeploy(deployWallet: DeployWallet): { to: string; data: string } {
    const { config, context, index = 0 } = deployWallet

    const { walletFactory } = context
    const { owner } = config
    const factoryInterface = walletFactory.getInterface()

    return {
      to: walletFactory.getAddress(), // from context
      data: factoryInterface.encodeFunctionData(
        factoryInterface.getFunction('deployCounterFactualAccount'),
        [owner, index]
      )
    }
  }

  async relay(relayTransaction: RelayTransaction): Promise<RelayResponse> {
    const { config, signedTx, context, gasLimit } = relayTransaction
    const { isDeployed, address } = config
    const { multiSendCall } = context // multisend has to be multiSendCallOnly here!
    if (!isDeployed) {
      const prepareWalletDeploy: DeployWallet = {
        config,
        context,
        index: 0
      }
      const { to, data } = this.prepareWalletDeploy(prepareWalletDeploy)
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
      Logger.log('finalRawTx', finalRawRx)

      const tx = this.signer.sendTransaction({
        ...finalRawRx,
        gasLimit: gasLimit ? (gasLimit as GasLimit).hex : ethers.constants.Two.pow(24)
      })
      return tx
      // rawTx to becomes multiSend address and data gets prepared again
    }

    const tx = this.signer.sendTransaction({
      ...signedTx.rawTx,
      gasLimit: gasLimit ? (gasLimit as GasLimit).hex : ethers.constants.Two.pow(24)
    })
    return tx
  }

  async getFeeOptions(chainId: number): Promise<FeeOptionsResponse> {
    Logger.log('requested fee options for chain ', chainId)
    // Mock response for local relayer to adhere with the interface!
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
            offset: 1000000,
            feeTokenTransferGas: 22975,
            refundReceiver: '0xc1d3206324d806b6586cf15324178f8e8781a293'
          }
        ]
      }
    }
    return feeOptions
  }
}
