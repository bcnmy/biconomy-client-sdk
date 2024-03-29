export * from "./utils/Types.js";
export * from "./utils/Constants.js";
export * from "./interfaces/IValidationModule.js";
export * from "./interfaces/ISessionValidationModule.js";
export * from "./BaseValidationModule.js";
export * from "./ECDSAOwnershipValidationModule.js";
export * from "./MultichainValidationModule.js";
export * from "./SessionKeyManagerModule.js";
export * from "./BatchedSessionRouterModule.js";
export * from "./session-validation-modules/ERC20SessionValidationModule.js";

import {
  BatchedSessionRouterModule,
  ECDSAOwnershipValidationModule,
  MultiChainValidationModule,
  SessionKeyManagerModule,
  ERC20SessionValidationModule,
} from "./index.js";

export const createBatchedSessionRouterModule = BatchedSessionRouterModule.create;
export const createMultiChainValidationModule = MultiChainValidationModule.create;
export const createECDSAOwnershipValidationModule = ECDSAOwnershipValidationModule.create;
export const createSessionKeyManagerModule = SessionKeyManagerModule.create;
export const createERC20SessionValidationModule = ERC20SessionValidationModule.create;

// export * from './PasskeyValidationModule'
