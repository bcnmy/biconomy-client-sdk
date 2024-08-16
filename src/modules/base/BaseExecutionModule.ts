import type { Address } from "viem"
import type { UserOpReceipt } from "../../bundler/index.js"
import { BaseModule } from "../base/BaseModule.js"
import type { Execution } from "../utils/Types.js"

export abstract class BaseExecutionModule extends BaseModule {
  abstract execute(
    execution: Execution | Execution[],
    ownedAccountAddress?: Address
  ): Promise<UserOpReceipt>
}
