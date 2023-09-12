import { BaseValidationModule } from '@biconomy/modules'
import { SmartAccountProviderOpts } from 'Types'
import { IBiconomyProvider } from 'interfaces/IBiconomyProvider'
import { BiconomySmartAccountV2 } from '@biconomy/account'
import { ChainId } from '@biconomy/core-types'

export class BiconomyProvider implements IBiconomyProvider {
  chainId: string
  paymasterUrl?: string
  bundlerUrl?: string
  defaultValidationModule: BaseValidationModule
  activeValidationModule: BaseValidationModule
  accountV2API: BiconomySmartAccountV2

  private constructor(opts: SmartAccountProviderOpts) {
    this.chainId = opts.chainId
    this.paymasterUrl = opts.paymasterUrl
    this.bundlerUrl = opts.bundlerUrl
    this.defaultValidationModule = opts.defaultValidationModule
    this.activeValidationModule = opts.defaultValidationModule
  }

  public static async create(opts: SmartAccountProviderOpts): Promise<BiconomyProvider> {
    const providerInstance = new BiconomyProvider(opts)

    const accountV2 = new BiconomySmartAccountV2({
      chainId: Number(opts.chainId) as ChainId,
      // paymaster: opts.paymasterUrl,
      // bundlerUrl: opts.bundlerUrl,
      defaultValidationModule: opts.defaultValidationModule
    })
    return providerInstance
  }

  async request(args: { method: string; params?: any[] }): Promise<any> {
    return Promise.resolve()
  }

  async getAddress(): Promise<string> {
    return Promise.resolve('0x')
  }

  async signMessage(msg: string | Uint8Array): Promise<string> {
    return Promise.resolve('0x')
  }
}
