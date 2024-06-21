import { type UserOpReceipt } from "../../bundler/index.js"
import { BaseModule } from "../base/BaseModule.js"
import type { Execution } from "../utils/Types.js"

export abstract class BaseExecutionModule extends BaseModule {
  abstract executeFromExecutor(execution: Execution | Execution[]): Promise<UserOpReceipt>;
}
