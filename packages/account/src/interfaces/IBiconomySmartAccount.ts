import { UserOperation, Transaction } from "@biconomy/core-types";
import { Overrides, InitilizationData } from "../utils/Types";
import { BigNumberish, BytesLike } from "ethers";
import { ISmartAccount } from "./ISmartAccount";
import { Signer } from "ethers";

export interface IBiconomySmartAccount extends ISmartAccount {
  init(_initilizationData?: InitilizationData): Promise<this>;
  initializeAccountAtIndex(_accountIndex: number): void;
  getExecuteCallData(_to: string, _value: BigNumberish, _data: BytesLike): string;
  getExecuteBatchCallData(_to: Array<string>, _value: Array<BigNumberish>, _data: Array<BytesLike>): string;
  buildUserOp(_transactions: Transaction[], _overrides?: Overrides): Promise<Partial<UserOperation>>;
  attachSigner(_signer: Signer): Promise<void>;
}
