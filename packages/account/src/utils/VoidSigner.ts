import { Provider, TransactionRequest } from "@ethersproject/providers";
import { BigNumberish, BytesLike, Bytes, Signer } from "ethers";
import { LogLevel, Logger } from "@ethersproject/logger";
const logger = new Logger("signer");

export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: BigNumberish;
  verifyingContract?: string;
  salt?: BytesLike;
}

export interface TypedDataField {
  name: string;
  type: string;
}

export type Deferrable<T> = {
  [K in keyof T]: T[K] | Promise<T[K]>;
};

export class VoidSigner extends Signer {
  readonly address: string;

  readonly provider?: Provider;

  constructor(_address: string, _provider?: Provider) {
    super();
    this.address = _address;
    this.provider = _provider;
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.address);
  }

  _fail(message: string, operation: string): Promise<any> {
    return Promise.resolve().then(() => {
      logger.throwError(message, Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
    });
  }

  signMessage(message: Bytes | string): Promise<string> {
    logger._log(LogLevel.INFO, [message]);
    return this._fail("VoidSigner cannot sign messages", "signMessage");
  }

  signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    logger._log(LogLevel.INFO, [transaction]);
    return this._fail("VoidSigner cannot sign transactions", "signTransaction");
  }

  connect(provider: Provider): VoidSigner {
    return new VoidSigner(this.address, provider);
  }
}
