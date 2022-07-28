import {
  Contract,
  Wallet,
  utils,
  BigNumber,
  BigNumberish,
  Signer,
  PopulatedTransaction,
  BytesLike
} from 'ethers'
import { TypedDataSigner } from '@ethersproject/abstract-signer'
import { AddressZero } from '@ethersproject/constants'

/*export interface SafeTransaction extends MetaTransaction {
    targetTxGas: string | number;
    baseGas: string | number;
    gasPrice: string | number;
    gasToken: string;
    refundReceiver: string;
    nonce: string | number;
};*/
