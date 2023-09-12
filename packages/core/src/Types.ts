import BaseValidationModule from '@biconomy/modules'

export interface SmartAccountProviderOpts {
  chainId: string
  paymasterUrl?: string
  bundlerUrl?: string
  defaultValidationModule: BaseValidationModule
}
