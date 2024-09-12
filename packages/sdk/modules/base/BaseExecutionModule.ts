import type { Address, Hash } from "viem"
import type { Execution } from "../utils/Types.js"
import { BaseModule } from "./BaseModule.js"

export abstract class BaseExecutionModule extends BaseModule {
  abstract execute(
    execution: Execution | Execution[],
    ownedAccountAddress?: Address
  ): Promise<Hash>
}
