export * from "./utils/Types.js"
export * from "./utils/Constants.js"
export * from "./utils/Helper.js"
export * from "./interfaces/IValidationModule.js"
export * from "./BaseValidationModule.js"
export * from "./ECDSAOwnershipValidationModule.js"
import { ECDSAOwnershipValidationModule } from "./index.js"

export const createECDSAOwnershipValidationModule =
  ECDSAOwnershipValidationModule.create
