export * from "./utils/Types.js"
export * from "./utils/Constants.js"
export * from "./utils/Helper.js"
export * from "./interfaces/IValidationModule.js"
export * from "./BaseValidationModule.js"
export * from "./K1ValidatorModule.js"
import { K1ValidatorModule } from "./index.js"

export const createECDSAOwnershipValidationModule = K1ValidatorModule.create
// export * from './PasskeyValidationModule'
