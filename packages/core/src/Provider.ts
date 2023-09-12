import { BaseValidationModule, ModuleInfo } from '@biconomy/modules'
import { Bundler, UserOpResponse } from '@biconomy/bundler'
import { ChainId, Transaction, UserOperation } from '@biconomy/core-types'
import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  BuildUserOpOptions
} from '@biconomy/account'
import { BiconomyPaymaster, SponsorUserOperationDto, PaymasterMode } from '@biconomy/paymaster'
import { IBiconomyProvider } from './interfaces/IBiconomyProvider'
import { PaymasterDto, SmartAccountProviderInternalOpts, SmartAccountProviderOpts } from './Types'

export class BiconomyProvider implements IBiconomyProvider {
  chainId: string
  paymaster: BiconomyPaymaster | undefined
  bundler: Bundler
  defaultValidationModule: BaseValidationModule
  activeValidationModule: BaseValidationModule
  accountV2API: BiconomySmartAccountV2

  private constructor(opts: SmartAccountProviderInternalOpts) {
    this.chainId = opts.chainId
    this.bundler = opts.bundler
    this.paymaster = opts.paymaster
    this.accountV2API = opts.accountV2API
    this.defaultValidationModule = opts.defaultValidationModule
    this.activeValidationModule = opts.defaultValidationModule
  }

  public static async create(opts: SmartAccountProviderOpts): Promise<BiconomyProvider> {
    // create bundler and paymaster instances
    const bundler = new Bundler({
      bundlerUrl: opts.bundlerUrl,
      chainId: Number(opts.chainId) as ChainId,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS
    })
    let paymaster: BiconomyPaymaster | undefined
    if (opts.paymasterUrl) {
      paymaster = new BiconomyPaymaster({
        paymasterUrl: opts.paymasterUrl
      })
    }

    // create accountV2 instance
    const accountV2 = new BiconomySmartAccountV2({
      chainId: Number(opts.chainId) as ChainId,
      // paymaster: opts.paymasterUrl,
      bundler: bundler,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: opts.defaultValidationModule
    })
    // initialize accountV2 instance
    await accountV2.init()

    // create provider instance and return
    const providerInstance = new BiconomyProvider({
      chainId: opts.chainId,
      paymaster: paymaster,
      bundler: bundler,
      accountV2API: accountV2,
      defaultValidationModule: opts.defaultValidationModule
    })
    return providerInstance
  }

  async getAddress(): Promise<string> {
    return this.accountV2API.getAccountAddress()
  }

  async getChainId(): Promise<string> {
    return this.chainId
  }

  async buildUserOperations(
    transactions: Transaction[],
    buildUseropDto?: BuildUserOpOptions,
    paymasterDto?: PaymasterDto
  ): Promise<Partial<UserOperation>> {
    const userOp = await this.accountV2API.buildUserOp(transactions, buildUseropDto)

    if (this.paymaster && paymasterDto?.mode === PaymasterMode.SPONSORED) {
      const paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED
      }
      const paymasterAndDataResponse = await this.paymaster.getPaymasterAndData(
        userOp,
        paymasterServiceData
      )
      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData
    } else if (this.paymaster && paymasterDto?.mode === PaymasterMode.ERC20) {
      // const paymasterServiceData: SponsorUserOperationDto = {
      //   mode: PaymasterMode.ERC20
      // }
      // const paymasterAndDataResponse = await this.paymaster.getPaymasterAndData(
      //   userOp,
      //   paymasterServiceData
      // )
      // userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData
    }
    return userOp
  }

  // async request(args: { method: string; params?: any[] }): Promise<any> {
  //   return Promise.resolve()
  // }

  async sendTransaction(userOp: Partial<UserOperation>): Promise<UserOpResponse> {
    const userOpResponse = await this.accountV2API.sendUserOp(userOp)
    return userOpResponse
  }

  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string> {
    return this.accountV2API.signUserOpHash(userOpHash, params)
  }

  async signMessage(): Promise<string> {
    return Promise.resolve('0x')
  }
}
