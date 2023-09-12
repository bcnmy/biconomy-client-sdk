import { BiconomySmartAccountV2 } from '@biconomy/account'
import { Bundler } from '@biconomy/bundler'
import { BaseValidationModule } from '@biconomy/modules'
import { PaymasterMode } from '@biconomy/paymaster'
import { BiconomyPaymaster } from '@biconomy/paymaster'

export interface SmartAccountProviderOpts {
  chainId: string
  bundlerUrl: string
  paymasterUrl?: string
  defaultValidationModule: BaseValidationModule
}

export interface SmartAccountProviderInternalOpts {
  chainId: string
  paymaster?: BiconomyPaymaster
  bundler: Bundler
  defaultValidationModule: BaseValidationModule
  accountV2API: BiconomySmartAccountV2
}

export interface PaymasterDto {
  mode: PaymasterMode.SPONSORED | PaymasterMode.ERC20
}
