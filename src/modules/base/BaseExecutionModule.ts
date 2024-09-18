import { BaseModule } from "../base/BaseModule.js"
import type { Execution } from "../utils/Types.js"
import { type NexusSmartAccount, type UserOperationStruct } from "../../account/index.js"

export abstract class BaseExecutionModule extends BaseModule {
  abstract getExecuteUserOp(
    execution: Execution | Execution[],
    smartAccount?: NexusSmartAccount
  ): Promise<Partial<UserOperationStruct>>
}
