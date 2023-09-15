import { Bundler, UserOpResponse } from "@biconomy/bundler";
import { BaseValidationModule, ModuleInfo } from "@biconomy/modules";
import { ChainId, Transaction, UserOperation } from "@biconomy/core-types";
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS, BuildUserOpOptions } from "@biconomy/account";
import { BiconomyPaymaster, PaymasterMode } from "@biconomy/paymaster";
import { IBiconomyProvider } from "./interfaces/IBiconomyProvider";
import { PaymasterDto, SmartAccountProviderInternalOpts, SmartAccountProviderOpts } from "./Types";

/**
 * @title BiconomyProvider Class
 * @dev Implements the IBiconomyProvider interface, acting as a wrapper over various Biconomy packages.
 */
export class BiconomyProvider implements IBiconomyProvider {
  chainId: string;

  paymaster: BiconomyPaymaster | undefined;

  bundler: Bundler;

  defaultValidationModule: BaseValidationModule;

  activeValidationModule: BaseValidationModule;

  accountV2API: BiconomySmartAccountV2;

  /**
   * This constructor is private. Use the static create method to instantiate a BiconomyProvider instance.
   * @param opts Object containing initialization options.
   * @returns BiconomyProvider instance.
   */
  private constructor(opts: SmartAccountProviderInternalOpts) {
    this.chainId = opts.chainId;
    this.bundler = opts.bundler;
    this.paymaster = opts.paymaster;
    this.accountV2API = opts.accountV2API;
    this.defaultValidationModule = opts.defaultValidationModule;
    this.activeValidationModule = opts.defaultValidationModule;
  }

  /**
   * Asynchronously creates and initializes an instance of BiconomyProvider.
   * @param opts Object containing options like chainId, paymasterUrl, etc.
   * @return Promise that resolves to a BiconomyProvider instance.
   */
  public static async create(opts: SmartAccountProviderOpts): Promise<BiconomyProvider> {
    // create bundler and paymaster instances
    const bundler = new Bundler({
      bundlerUrl: opts.bundlerUrl,
      chainId: Number(opts.chainId) as ChainId,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    });
    let paymaster: BiconomyPaymaster | undefined;
    if (opts.paymasterUrl) {
      paymaster = new BiconomyPaymaster({
        paymasterUrl: opts.paymasterUrl,
      });
    }

    // create accountV2 instance
    const accountV2 = new BiconomySmartAccountV2({
      chainId: Number(opts.chainId) as ChainId,
      // paymaster: opts.paymasterUrl,
      bundler: bundler,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: opts.defaultValidationModule,
    });
    // initialize accountV2 instance
    await accountV2.init();

    // create provider instance and return
    const providerInstance = new BiconomyProvider({
      chainId: opts.chainId,
      paymaster: paymaster,
      bundler: bundler,
      accountV2API: accountV2,
      defaultValidationModule: opts.defaultValidationModule,
    });
    return providerInstance;
  }

  /**
   * Method to get the smart account address.
   * @return Promise that resolves to the account address string.
   */
  async getAddress(): Promise<string> {
    return this.accountV2API.getAccountAddress();
  }

  // might remove this method
  getChainId(): string {
    return this.chainId;
  }

  /**
   * Method to build user operations.
   * @param transactions Array of transactions.
   * @param buildUseropDto Optional BuildUserOpOptions object.
   * @param paymasterDto Optional PaymasterDto object.
   * @return Promise that resolves to a Partial<UserOperation> object.
   */
  async buildUserOperations(
    transactions: Transaction[],
    buildUseropDto?: BuildUserOpOptions,
    paymasterDto?: PaymasterDto,
  ): Promise<Partial<UserOperation>> {
    const userOp = await this.accountV2API.buildUserOp(transactions, buildUseropDto);

    if (this.paymaster && paymasterDto?.mode === PaymasterMode.SPONSORED) {
      const paymasterAndDataResponse = await this.paymaster.getPaymasterAndData(userOp, {
        mode: PaymasterMode.SPONSORED,
      });
      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
    } else if (this.paymaster && paymasterDto?.mode === PaymasterMode.ERC20 && paymasterDto?.preferredTokenAddress) {
      const paymasterAndDataResponse = await this.paymaster.getPaymasterAndData(userOp, {
        mode: PaymasterMode.SPONSORED,
        feeTokenAddress: paymasterDto.preferredTokenAddress,
      });
      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
    }
    return userOp;
  }

  /**
   * Method to send a user operation.
   * @param userOp Partial user operation object.
   * @return Promise that resolves to a UserOpResponse object.
   */
  async sendUserOperation(userOp: Partial<UserOperation>): Promise<UserOpResponse> {
    const userOpResponse = await this.accountV2API.sendUserOp(userOp);
    return userOpResponse;
  }

  /**
   * Method to send a transaction, abstract all methods.
   * @param transactions Array of transactions.
   * @param buildUseropDto Optional BuildUserOpOptions object.
   * @param paymasterDto Optional PaymasterDto object.
   * @return Promise that resolves to a UserOpResponse object.
   */
  async sendTransactions(transactions: Transaction[], buildUseropDto?: BuildUserOpOptions, paymasterDto?: PaymasterDto): Promise<UserOpResponse> {
    const userOp = await this.buildUserOperations(transactions, buildUseropDto, paymasterDto);
    const userOpResponse = await this.sendUserOperation(userOp);
    return userOpResponse;
  }

  /**
   * Method to send a transaction, abstract all methods.
   * @param transaction Transaction object.
   * @param buildUseropDto Optional BuildUserOpOptions object.
   * @param paymasterDto Optional PaymasterDto object.
   * @return Promise that resolves to a UserOpResponse object.
   */
  async sendTransaction(transaction: Transaction, buildUseropDto?: BuildUserOpOptions, paymasterDto?: PaymasterDto): Promise<UserOpResponse> {
    this.sendTransactions([transaction], buildUseropDto, paymasterDto);
  }

  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<string> {
    return this.accountV2API.signUserOpHash(userOpHash, params);
  }

  // TODO: implement this method
  // eslint-disable-next-line no-unused-vars
  request: (args: { method: string; params?: any[] }) => Promise<any> = async (args) => {
    const { method, params } = args;
    switch (method) {
      case "eth_sendTransaction":
        // eslint-disable-next-line no-case-declarations
        const tx = params as Transaction;
        return this.sendTransaction(tx);
      case "eth_sign":
        // eslint-disable-next-line no-case-declarations
        const [_, data] = params as [string, string];
        return this.accountV2API.signMessage(data);
      case "personal_sign": {
        break;
      }
      case "eth_signTypedData_v4": {
        break;
      }
      case "eth_chainId":
        return this.getChainId();
      default:
      // return this.accountV2API.request(args);
    }
  };

  async signMessage(): Promise<string> {
    return Promise.resolve("0x");
  }
}
