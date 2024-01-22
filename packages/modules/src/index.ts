export * from "./utils/Types";
export * from "./utils/Constants";
export * from "./interfaces/IValidationModule";
export * from "./interfaces/ISessionValidationModule";
export * from "./BaseValidationModule";
export * from "./ECDSAOwnershipValidationModule";
export * from "./MultichainValidationModule";
export * from "./SessionKeyManagerModule";
export * from "./BatchedSessionRouterModule";
export * from "./session-validation-modules/ERC20SessionValidationModule";

import {
  BatchedSessionRouterModule,
  ECDSAOwnershipValidationModule,
  MultiChainValidationModule,
  SessionKeyManagerModule,
  ERC20SessionValidationModule,
} from "./";

export const createBatchedSessionRouterModule = BatchedSessionRouterModule.create;
export const createMultiChainValidationModule = MultiChainValidationModule.create;
export const createECDSAOwnershipValidationModule = ECDSAOwnershipValidationModule.create;
export const createSessionKeyManagerModule = SessionKeyManagerModule.create;
export const createERC20SessionValidationModule = ERC20SessionValidationModule.create;

// export * from './PasskeyValidationModule'
