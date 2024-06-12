import type { Hash } from "viem"
import type { SimulationType } from "../../account"
import type { StateOverrideSet, UserOperationStruct } from "../../account"
import type {
  GetUserOperationGasPriceReturnType,
  UserOpByHashResponse,
  UserOpGasResponse,
  UserOpReceipt,
  UserOpResponse,
  UserOpStatus
} from "../utils/Types.js"

export interface IBundler {
  estimateUserOpGas(
    _userOp: Partial<UserOperationStruct>,
    stateOverrideSet?: StateOverrideSet
  ): Promise<UserOpGasResponse>
  sendUserOp(
    _userOp: UserOperationStruct,
    _simulationType?: SimulationType
  ): Promise<Hash>
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>
  getGasFeeValues(): Promise<GetUserOperationGasPriceReturnType>
  getUserOpStatus(_userOpHash: string): Promise<UserOpStatus>
  getBundlerUrl(): string
}
