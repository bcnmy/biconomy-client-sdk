import type { Address, Chain, Client, Hash, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import type { ModuleType, SafeHookType } from "../../../modules/utils/Types.js"
import { accountId } from "./accountId.js"
import { type GetActiveHookParameters, getActiveHook } from "./getActiveHook.js"
import {
  type GetFallbackBySelectorParameters,
  getFallbackBySelector
} from "./getFallbackBySelector.js"
import {
  type GetInstalledExecutorsParameters,
  getInstalledExecutors
} from "./getInstalledExecutors.js"
import {
  type GetInstalledValidatorsParameters,
  getInstalledValidators
} from "./getInstalledValidators.js"
import { type InstallModuleParameters, installModule } from "./installModule.js"
import {
  type InstallModulesParameters,
  installModules
} from "./installModules.js"
import {
  type IsModuleInstalledParameters,
  isModuleInstalled
} from "./isModuleInstalled.js"
import {
  type SupportsExecutionModeParameters,
  supportsExecutionMode
} from "./supportsExecutionMode.js"
import type { CallType, ExecutionMode } from "./supportsExecutionMode.js"
import {
  type SupportsModuleParameters,
  supportsModule
} from "./supportsModule.js"
import {
  type UninstallModuleParameters,
  uninstallModule
} from "./uninstallModule.js"
import {
  type UninstallModulesParameters,
  uninstallModules
} from "./uninstallModules.js"
import {
  type GetPreviousModuleParameters,
  getPreviousModule
} from "./getPreviousModule.js"

export type Erc7579Actions<TSmartAccount extends SmartAccount | undefined> = {
  accountId: (args?: GetSmartAccountParameter<TSmartAccount>) => Promise<string>
  installModule: (args: InstallModuleParameters<TSmartAccount>) => Promise<Hash>
  installModules: (
    args: InstallModulesParameters<TSmartAccount>
  ) => Promise<Hash>
  isModuleInstalled: (
    args: IsModuleInstalledParameters<TSmartAccount>
  ) => Promise<boolean>
  supportsExecutionMode: (
    args: SupportsExecutionModeParameters<TSmartAccount>
  ) => Promise<boolean>
  supportsModule: (
    args: SupportsModuleParameters<TSmartAccount>
  ) => Promise<boolean>
  uninstallModule: (
    args: UninstallModuleParameters<TSmartAccount>
  ) => Promise<Hash>
  uninstallModules: (
    args: UninstallModulesParameters<TSmartAccount>
  ) => Promise<Hash>
  getInstalledValidators: (
    args: GetInstalledValidatorsParameters<TSmartAccount>
  ) => Promise<readonly [readonly Hex[], Hex]>
  getInstalledExecutors: (
    args: GetInstalledExecutorsParameters<TSmartAccount>
  ) => Promise<readonly [readonly Hex[], Hex]>
  getActiveHook: (args: GetActiveHookParameters<TSmartAccount>) => Promise<Hex>
  getFallbackBySelector: (
    args: GetFallbackBySelectorParameters<TSmartAccount>
  ) => Promise<[Hex, Hex]>
  getPreviousModule: (args: GetPreviousModuleParameters<TSmartAccount>) => Promise<Hex>
}

export type {
  InstallModuleParameters,
  IsModuleInstalledParameters,
  CallType,
  ExecutionMode,
  SupportsExecutionModeParameters,
  ModuleType,
  SupportsModuleParameters,
  UninstallModuleParameters,
  GetInstalledValidatorsParameters,
  GetInstalledExecutorsParameters,
  GetActiveHookParameters,
  GetPreviousModuleParameters
}

export {
  accountId,
  installModule,
  installModules,
  isModuleInstalled,
  supportsExecutionMode,
  supportsModule,
  uninstallModule,
  uninstallModules,
  getInstalledValidators,
  getInstalledExecutors,
  getActiveHook,
  getFallbackBySelector,
  getPreviousModule
}

export function erc7579Actions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): Erc7579Actions<TSmartAccount> => ({
    accountId: (args) => accountId(client, args),
    installModule: (args) => installModule(client, args),
    installModules: (args) => installModules(client, args),
    isModuleInstalled: (args) => isModuleInstalled(client, args),
    supportsExecutionMode: (args) => supportsExecutionMode(client, args),
    supportsModule: (args) => supportsModule(client, args),
    uninstallModule: (args) => uninstallModule(client, args),
    uninstallModules: (args) => uninstallModules(client, args),
    getInstalledValidators: (args) => getInstalledValidators(client, args),
    getInstalledExecutors: (args) => getInstalledExecutors(client, args),
    getActiveHook: (args) => getActiveHook(client, args),
    getFallbackBySelector: (args) => getFallbackBySelector(client, args),
    getPreviousModule: (args) => getPreviousModule(client, args)
  })
}

export type Module = {
  address: Address
  data?: Hex
  additionalContext?: Hex
  type: ModuleType

  /* ---- kernel module params ---- */
  // these param needed for installing validator, executor, fallback handler
  hook?: Address
  /* ---- end kernel module params ---- */

  /* ---- safe module params ---- */
  // these two params needed for installing hooks
  hookType?: SafeHookType
  selector?: Hex

  // these two params needed for installing fallback handlers
  functionSig?: Hex
  callType?: CallType
}
