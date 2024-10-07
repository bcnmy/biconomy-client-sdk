import { UserOperation, Transaction } from "@biconomy/core-types";
import {
  SupportedChainsResponse,
  BalancesResponse,
  BalancesDto,
  UsdBalanceResponse,
  SmartAccountByOwnerDto,
  SmartAccountsResponse,
  SCWTransactionResponse,
} from "@biconomy/node-client";
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
  // getAllTokenBalances(_balancesDto: BalancesDto): Promise<BalancesResponse>;
  // getTotalBalanceInUsd(_balancesDto: BalancesDto): Promise<UsdBalanceResponse>;
  // getSmartAccountsByOwner(_smartAccountByOwnerDto: SmartAccountByOwnerDto): Promise<SmartAccountsResponse>;
  // getTransactionsByAddress(_chainId: number, _address: string): Promise<SCWTransactionResponse[]>;
  // getTransactionByHash(_txHash: string): Promise<SCWTransactionResponse>;
  // getAllSupportedChains(): Promise<SupportedChainsResponse>;
  attachSigner(_signer: Signer): Promise<void>;
}
