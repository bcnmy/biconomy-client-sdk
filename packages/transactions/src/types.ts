import {
    Contract,
    Wallet,
    utils,
    BigNumber,
    BigNumberish,
    Signer,
    PopulatedTransaction,
  } from "ethers";
  import { TypedDataSigner } from "@ethersproject/abstract-signer";
  import { AddressZero } from "@ethersproject/constants";


export const EIP712_WALLET_TX_TYPE = {
    // "WalletTx(address to,uint256 value,bytes data,uint8 operation,uint256 targetTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    WalletTx: [
      { type: "address", name: "to" },
      { type: "uint256", name: "value" },
      { type: "bytes", name: "data" },
      { type: "uint8", name: "operation" },
      { type: "uint256", name: "targetTxGas" },
      { type: "uint256", name: "baseGas" },
      { type: "uint256", name: "gasPrice" },
      { type: "address", name: "gasToken" },
      { type: "address", name: "refundReceiver" },
      { type: "uint256", name: "nonce" },
    ],
};

export interface MetaTransaction {
    to: string;
    value: string | number | BigNumber;
    data: string;
    operation: number;
};
  
/*export interface SafeTransaction extends MetaTransaction {
    targetTxGas: string | number;
    baseGas: string | number;
    gasPrice: string | number;
    gasToken: string;
    refundReceiver: string;
    nonce: string | number;
};*/
  
export interface Transaction {
    to: string;
    value: string | number | BigNumber;
    data: string;
    operation: number;
    targetTxGas: string | number;
};

export interface FeeRefund {
    baseGas: string | number;
    gasPrice: string | number;
    gasToken: string;
    refundReceiver: string;
};
  
export interface WalletTransaction {
    _tx: Transaction;
    refundInfo: FeeRefund;
    batchId: number;
    nonce: string | number;
};


