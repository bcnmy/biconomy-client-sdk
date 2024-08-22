import { ethers } from "ethers"
import {
  type Address,
  type GetContractReturnType,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
  concat,
  concatHex,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  formatUnits,
  getAddress,
  getContract,
  keccak256,
  parseAbi,
  parseAbiParameters,
  toBytes
} from "viem"
import { contracts } from "../../src/contracts"
import {
  Bundler,
  Executions,
  type GetUserOperationGasPriceReturnType,
  type UserOpReceipt,
  type UserOpResponse
} from "../bundler/index.js"
import type { IBundler } from "../bundler/interfaces/IBundler.js"
import { EXECUTE_BATCH, EXECUTE_SINGLE } from "../bundler/utils/Constants.js"
import { NexusAbi } from "../contracts/abi"
import type { BaseExecutionModule } from "../modules/base/BaseExecutionModule.js"
import { BaseValidationModule } from "../modules/base/BaseValidationModule.js"
import {
  type Execution,
  type Module,
  type ModuleInfo,
  type SendUserOpParams,
  createK1ValidatorModule,
  createValidationModule,
  moduleTypeIds
} from "../modules/index.js"
import type { K1ValidatorModule } from "../modules/validators/K1ValidatorModule.js"
import {
  type FeeQuotesOrDataDto,
  type FeeQuotesOrDataResponse,
  type IHybridPaymaster,
  type IPaymaster,
  Paymaster,
  PaymasterMode,
  type SponsorUserOperationDto
} from "../paymaster/index.js"
import {
  BaseSmartContractAccount,
  type DeploymentState
} from "./BaseSmartContractAccount.js"
import {
  Logger,
  type SmartAccountSigner,
  type StateOverrideSet,
  type UserOperationStruct,
  convertSigner
} from "./index.js"
import {
  GENERIC_FALLBACK_SELECTOR,
  type MODE_MODULE_ENABLE,
  MODE_VALIDATION
} from "./utils/Constants.js"
import {
  ADDRESS_ZERO,
  ERC20_ABI,
  ERROR_MESSAGES,
  MAGIC_BYTES,
  NATIVE_TOKEN_ALIAS,
  SENTINEL_ADDRESS
} from "./utils/Constants.js"
import type {
  BalancePayload,
  BiconomyTokenPaymasterRequest,
  BigNumberish,
  BuildUserOpOptions,
  CounterFactualAddressParam,
  NexusSmartAccountConfig,
  NexusSmartAccountConfigConstructorProps,
  NonceOptions,
  PaymasterUserOperationDto,
  SupportedToken,
  Transaction,
  TransferOwnershipCompatibleModule,
  WithdrawalRequest
} from "./utils/Types.js"
import { addressEquals, isNullOrUndefined, packUserOp } from "./utils/Utils.js"

export class NexusSmartAccount extends BaseSmartContractAccount {
  private index: bigint

  private chainId: number

  paymaster?: IPaymaster

  bundler?: IBundler

  private accountContract?: GetContractReturnType<
    typeof NexusAbi,
    PublicClient | WalletClient
  >

  // private scanForUpgradedAccountsFromV1!: boolean

  // private maxIndexForScan!: bigint

  // Validation module responsible for account deployment initCode. This acts as a default authorization module.
  defaultValidationModule!: BaseValidationModule

  // Deployed Smart Account can have more than one module enabled. When sending a transaction activeValidationModule is used to prepare and validate userOp signature.
  activeValidationModule!: BaseValidationModule

  installedExecutors: BaseExecutionModule[] = []
  activeExecutionModule?: BaseExecutionModule
  k1ValidatorAddress: Address

  private constructor(
    readonly nexusSmartAccountConfig: NexusSmartAccountConfigConstructorProps
  ) {
    const resolvedEntryPointAddress =
      (nexusSmartAccountConfig.entryPointAddress as Hex) ??
      contracts.EntryPoint.address

    super({
      ...nexusSmartAccountConfig,
      entryPointAddress: resolvedEntryPointAddress,
      accountAddress:
        (nexusSmartAccountConfig.accountAddress as Hex) ?? undefined,
      factoryAddress: nexusSmartAccountConfig.factoryAddress
    })

    this.k1ValidatorAddress = nexusSmartAccountConfig.k1ValidatorAddress
    const chain = nexusSmartAccountConfig.chain

    this.defaultValidationModule =
      nexusSmartAccountConfig.defaultValidationModule
    this.activeValidationModule = nexusSmartAccountConfig.activeValidationModule

    this.index = nexusSmartAccountConfig.index ?? 0n
    this.chainId = chain.id
    this.bundler = nexusSmartAccountConfig.bundler

    if (nexusSmartAccountConfig.paymasterUrl) {
      this.paymaster = new Paymaster({
        paymasterUrl: nexusSmartAccountConfig.paymasterUrl
      })
    } else if (nexusSmartAccountConfig.biconomyPaymasterApiKey) {
      this.paymaster = new Paymaster({
        paymasterUrl: `https://paymaster.biconomy.io/api/v1/${nexusSmartAccountConfig.chain.id}/${nexusSmartAccountConfig.biconomyPaymasterApiKey}`
      })
    } else {
      this.paymaster = nexusSmartAccountConfig.paymaster
    }

    this.bundler = nexusSmartAccountConfig.bundler

    // Added bang operator to avoid null check as the constructor have these params as optional
    this.defaultValidationModule =
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      nexusSmartAccountConfig.defaultValidationModule!
    this.activeValidationModule =
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      nexusSmartAccountConfig.activeValidationModule!

    // this.publicClient = createPublicClient({
    //   chain,
    //   transport: http(rpcClient)
    // })

    // this.scanForUpgradedAccountsFromV1 =
    // nexusSmartAccountConfig.scanForUpgradedAccountsFromV1 ?? false
    // this.maxIndexForScan = nexusSmartAccountConfig.maxIndexForScan ?? 10n
    // this.getAddress()
  }

  /**
   * Creates a new instance of NexusSmartAccount
   *
   * This method will create a NexusSmartAccount instance but will not deploy the Smart Account
   * Deployment of the Smart Account will be donewith the first user operation.
   *
   * - Docs: https://docs.biconomy.io/Account/integration#integration-1
   *
   * @param nexusSmartAccountConfig - Configuration for initializing the NexusSmartAccount instance {@link NexusSmartAccountConfig}.
   * @returns A promise that resolves to a new instance of NexusSmartAccount.
   * @throws An error if something is wrong with the smart account instance creation.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient, NexusSmartAccount } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const bundlerUrl = "" // Retrieve bundler url from dashboard
   *
   * const smartAccountFromStaticCreate = await NexusSmartAccount.create({ signer, bundlerUrl });
   *
   * // Is the same as...
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl });
   *
   */
  public static async create(
    nexusSmartAccountConfig: NexusSmartAccountConfig
  ): Promise<NexusSmartAccount> {
    let resolvedSmartAccountSigner!: SmartAccountSigner
    const defaultedRpcUrl =
      nexusSmartAccountConfig.rpcUrl ??
      nexusSmartAccountConfig.chain.rpcUrls.default.http[0]

    const defaultedEntryPointAddress =
      (nexusSmartAccountConfig.entryPointAddress ??
        contracts.EntryPoint.address) as Hex

    // Signer needs to be initialised here before defaultValidationModule is set
    if (nexusSmartAccountConfig.signer) {
      const signerResult = await convertSigner(
        nexusSmartAccountConfig.signer,
        nexusSmartAccountConfig.rpcUrl
      )
      resolvedSmartAccountSigner = signerResult.signer
    }

    const bundler: IBundler =
      nexusSmartAccountConfig.bundler ??
      new Bundler({
        // biome-ignore lint/style/noNonNullAssertion: always required
        bundlerUrl: nexusSmartAccountConfig.bundlerUrl!,
        chain: nexusSmartAccountConfig.chain
      })

    let defaultValidationModule =
      nexusSmartAccountConfig.defaultValidationModule

    const k1ValidatorAddress =
      nexusSmartAccountConfig.k1ValidatorAddress ??
      (contracts.K1Validator.address as Hex)
    const factoryAddress =
      nexusSmartAccountConfig.factoryAddress ??
      (contracts.K1ValidatorFactory.address as Hex)

    if (!defaultValidationModule) {
      const newModule = await createK1ValidatorModule(
        resolvedSmartAccountSigner,
        k1ValidatorAddress
      )
      defaultValidationModule = newModule as K1ValidatorModule
    }
    const activeValidationModule =
      nexusSmartAccountConfig?.activeValidationModule ?? defaultValidationModule
    if (!resolvedSmartAccountSigner) {
      resolvedSmartAccountSigner = activeValidationModule.getSigner()
    }
    if (!resolvedSmartAccountSigner) {
      throw new Error("signer required")
    }

    const config: NexusSmartAccountConfigConstructorProps = {
      ...nexusSmartAccountConfig,
      factoryAddress,
      k1ValidatorAddress,
      defaultValidationModule,
      activeValidationModule,
      rpcUrl: defaultedRpcUrl,
      bundler,
      signer: resolvedSmartAccountSigner,
      entryPointAddress: defaultedEntryPointAddress
    }

    return new NexusSmartAccount(config)
  }

  override async getAddress(params?: CounterFactualAddressParam): Promise<Hex> {
    if (isNullOrUndefined(this.accountAddress)) {
      const signerAddress = await this.signer.getAddress()
      const index = params?.index ?? this.index
      this.accountAddress = (await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: contracts.K1ValidatorFactory.abi,
        functionName: "computeAccountAddress",
        args: [signerAddress, index, [], 0]
      })) as Hex
    }
    return this.accountAddress
  }

  /**
   * Returns an upper estimate for the gas spent on a specific user operation
   *
   * This method will fetch an approximate gas estimate for the user operation, given the current state of the network.
   * It is regularly an overestimate, and the actual gas spent will likely be lower.
   * It is unlikely to be an underestimate unless the network conditions rapidly change.
   *
   * @param transactions Array of {@link Transaction} to be sent.
   * @param buildUseropDto {@link BuildUserOpOptions}.
   * @returns Promise<bigint> - The estimated gas cost in wei.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, paymasterUrl }); // Retrieve bundler/paymaster url from dashboard
   * const encodedCall = encodeFunctionData({
   *   abi: parseAbi(["function safeMint(address to) public"]),
   *   functionName: "safeMint",
   *   args: ["0x..."],
   * });
   *
   * const tx = {
   *   to: nftAddress,
   *   data: encodedCall
   * }
   *
   * const amountInWei = await smartAccount.getGasEstimates([tx, tx], {
   *    paymasterServiceData: {
   *      mode: PaymasterMode.SPONSORED,
   *    },
   * });
   *
   * console.log(amountInWei.toString());
   *
   */
  public async getGasEstimate(
    transactions: Transaction[],
    buildUseropDto?: BuildUserOpOptions
  ): Promise<bigint> {
    const {
      callGasLimit,
      preVerificationGas,
      verificationGasLimit,
      maxFeePerGas
    } = await this.buildUserOp(transactions, buildUseropDto)

    const _callGasLimit = BigInt(callGasLimit || 0)
    const _preVerificationGas = BigInt(preVerificationGas || 0)
    const _verificationGasLimit = BigInt(verificationGasLimit || 0)
    const _maxFeePerGas = BigInt(maxFeePerGas || 0)

    if (!buildUseropDto?.paymasterServiceData?.mode) {
      return (
        (_callGasLimit + _preVerificationGas + _verificationGasLimit) *
        _maxFeePerGas
      )
    }
    return (
      (_callGasLimit +
        BigInt(3) * _verificationGasLimit +
        _preVerificationGas) *
      _maxFeePerGas
    )
  }

  /**
   * Returns balances for the smartAccount instance.
   *
   * This method will fetch tokens info given an array of token addresses for the smartAccount instance.
   * The balance of the native token will always be returned as the last element in the reponse array, with the address set to 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.
   *
   * @param addresses - Optional. Array of asset addresses to fetch the balances of. If not provided, the method will return only the balance of the native token.
   * @returns Promise<Array<BalancePayload>> - An array of token balances (plus the native token balance) of the smartAccount instance.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a";
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl });
   * const [tokenBalanceFromSmartAccount, nativeTokenBalanceFromSmartAccount] = await smartAccount.getBalances([token]);
   *
   * console.log(tokenBalanceFromSmartAccount);
   * // {
   * //   amount: 1000000000000000n,
   * //   decimals: 6,
   * //   address: "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a",
   * //   formattedAmount: "1000000",
   * //   chainId: 11155111
   * // }
   *
   * // or to get the nativeToken balance
   *
   * const [nativeTokenBalanceFromSmartAccount] = await smartAccount.getBalances();
   *
   * console.log(nativeTokenBalanceFromSmartAccount);
   * // {
   * //   amount: 1000000000000000n,
   * //   decimals: 18,
   * //   address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
   * //   formattedAmount: "1",
   * //   chainId: 11155111
   * // }
   *
   */
  public async getBalances(
    addresses?: Array<Hex>
  ): Promise<Array<BalancePayload>> {
    const accountAddress = await this.getAddress()
    const result: BalancePayload[] = []

    if (addresses) {
      const tokenContracts = addresses.map((address) =>
        getContract({
          address,
          abi: parseAbi(ERC20_ABI),
          client: this.publicClient
        })
      )

      const balancePromises = tokenContracts.map((tokenContract) =>
        tokenContract.read.balanceOf([accountAddress])
      ) as Promise<bigint>[]
      const decimalsPromises = tokenContracts.map((tokenContract) =>
        tokenContract.read.decimals()
      ) as Promise<number>[]
      const [balances, decimalsPerToken] = await Promise.all([
        Promise.all(balancePromises),
        Promise.all(decimalsPromises)
      ])

      balances.forEach((amount, index) =>
        result.push({
          amount,
          decimals: decimalsPerToken[index],
          address: addresses[index],
          formattedAmount: formatUnits(amount, decimalsPerToken[index]),
          chainId: this.chainId
        })
      )
    }

    const balance = await this.publicClient.getBalance({
      address: accountAddress
    })

    result.push({
      amount: balance,
      decimals: 18,
      address: NATIVE_TOKEN_ALIAS,
      formattedAmount: formatUnits(balance, 18),
      chainId: this.chainId
    })

    return result
  }

  /**
   * Transfers funds from Smart Account to recipient (usually EOA)
   * @param recipient - Address of the recipient
   * @param withdrawalRequests - Array of withdrawal requests {@link WithdrawalRequest}. If withdrawal request is an empty array, it will transfer the balance of the native token. Using a paymaster will ensure no dust remains in the smart account.
   * @param buildUseropDto - Optional. {@link BuildUserOpOptions}
   *
   * @returns Promise<Hash> - An object containing the status of the transaction.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient, NATIVE_TOKEN_ALIAS } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonMumbai } from "viem/chains";
   *
   * const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a";
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonMumbai,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, biconomyPaymasterApiKey });
   *
   * const { wait } = await smartAccount.withdraw(
   *  [
   *    { address: token }, // omit the amount to withdraw the full balance
   *    { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) }
   *  ],
   *  account.address, // Default recipient used if no recipient is present in the withdrawal request
   *  {
   *    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
   *  }
   * );
   *
   * // OR to withdraw all of the native token, leaving no dust in the smart account
   *
   * const { wait } = await smartAccount.withdraw([], account.address, {
   *  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
   * });
   *
   * const { success } = await wait();
   */
  public async withdraw(
    withdrawalRequests?: WithdrawalRequest[] | null,
    defaultRecipient?: Hex | null,
    buildUseropDto?: BuildUserOpOptions
  ): Promise<UserOpResponse> {
    const accountAddress = this.accountAddress ?? (await this.getAddress())

    if (
      !defaultRecipient &&
      withdrawalRequests?.some(({ recipient }) => !recipient)
    ) {
      throw new Error(ERROR_MESSAGES.NO_RECIPIENT)
    }

    // Remove the native token from the withdrawal requests
    let tokenRequests =
      withdrawalRequests?.filter(
        ({ address }) => !addressEquals(address, NATIVE_TOKEN_ALIAS)
      ) ?? []

    // Check if the amount is not present in all withdrawal requests
    const shouldFetchMaxBalances = tokenRequests.some(({ amount }) => !amount)

    // Get the balances of the tokens if the amount is not present in the withdrawal requests
    if (shouldFetchMaxBalances) {
      const balances = await this.getBalances(
        tokenRequests.map(({ address }) => address)
      )
      tokenRequests = tokenRequests.map(({ amount, address }, i) => ({
        address,
        amount: amount ?? balances[i].amount
      }))
    }

    // Create the transactions
    const txs: Transaction[] = tokenRequests.map(
      ({ address, amount, recipient: recipientFromRequest }) => ({
        to: address,
        data: encodeFunctionData({
          abi: parseAbi(ERC20_ABI),
          functionName: "transfer",
          args: [recipientFromRequest || defaultRecipient, amount]
        })
      })
    )

    // Check if eth alias is present in the original withdrawal requests
    const nativeTokenRequest = withdrawalRequests?.find(({ address }) =>
      addressEquals(address, NATIVE_TOKEN_ALIAS)
    )
    const hasNoRequests = !withdrawalRequests?.length
    if (!!nativeTokenRequest || hasNoRequests) {
      // Check that an amount is present in the withdrawal request, if no paymaster service data is present, as max amounts cannot be calculated without a paymaster.
      if (
        !nativeTokenRequest?.amount &&
        !buildUseropDto?.paymasterServiceData?.mode
      ) {
        throw new Error(ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT)
      }

      // get eth balance if not present in withdrawal requests
      const nativeTokenAmountToWithdraw =
        nativeTokenRequest?.amount ??
        (await this.publicClient.getBalance({ address: accountAddress }))

      txs.push({
        to: (nativeTokenRequest?.recipient ?? defaultRecipient) as Hex,
        value: nativeTokenAmountToWithdraw
      })
    }

    return this.sendTransaction(txs, buildUseropDto)
  }

  async _getAccountContract(): Promise<
    GetContractReturnType<typeof NexusAbi, PublicClient>
  > {
    if (this.accountContract == null) {
      this.accountContract = getContract({
        address: await this.getAddress(),
        abi: NexusAbi,
        client: this.publicClient as PublicClient
      })
    }
    return this.accountContract
  }

  isActiveValidationModuleDefined(): boolean {
    if (!this.activeValidationModule)
      throw new Error("Must provide an instance of active validation module.")
    return true
  }

  isDefaultValidationModuleDefined(): boolean {
    if (!this.defaultValidationModule)
      throw new Error("Must provide an instance of default validation module.")
    return true
  }

  /**
   * Sets the active validation module on the NexusSmartAccount instance
   * @param validationModule - BaseValidationModule instance
   *
   * @returns Promise<BaseValidationModule> - The BaseValidationModule instance.
   */
  setActiveValidationModule(
    validationModule: BaseValidationModule
  ): BaseValidationModule {
    if (validationModule instanceof BaseValidationModule) {
      this.activeValidationModule = validationModule
    }
    return this.activeValidationModule
  }

  /**
   * Sets the active validation module on the NexusSmartAccount instance
   * @param validationModuleAddress - Address of the validation module
   * @param data - Initialization data for the validation module
   *
   * @returns Promise<BaseValidationModule> - The BaseValidationModule instance.
   */
  async setActiveValidationModuleByAddress({
    validationModuleAddress,
    data
  }: {
    validationModuleAddress: Address
    data: Hex
  }): Promise<BaseValidationModule> {
    if (validationModuleAddress) {
      this.activeValidationModule = await createValidationModule(
        this.signer,
        validationModuleAddress,
        data
      )
      return this.activeValidationModule
    }
    throw new Error("Validation module address is required")
  }

  /**
   * Sets the active executor module on the NexusSmartAccount instance
   * @param executorModule - Address of the executor module
   * @param data - Initialization data for the executor module
   *
   * @returns Promise<BaseExecutionModule> - The BaseExecutionModule instance.
   */
  setActiveExecutionModule(
    executorModule: BaseExecutionModule
  ): BaseExecutionModule {
    this.activeExecutionModule = executorModule
    return this.activeExecutionModule
  }

  setDefaultValidationModule(
    validationModule: BaseValidationModule
  ): NexusSmartAccount {
    if (validationModule instanceof BaseValidationModule) {
      this.defaultValidationModule = validationModule
    }
    return this
  }

  setDeploymentState(deploymentState: DeploymentState) {
    this.deploymentState = deploymentState
  }

  // async getV1AccountsUpgradedToV2(
  //   params: QueryParamsForAddressResolver
  // ): Promise<Hex> {
  //   const maxIndexForScan = params.maxIndexForScan ?? this.maxIndexForScan

  //   const addressResolver = getContract({
  //     address: ADDRESS_RESOLVER_ADDRESS,
  //     abi: AccountResolverAbi,
  //     client: {
  //       public: this.publicClient as PublicClient
  //     }
  //   })
  //   // Note: depending on moduleAddress and moduleSetupData passed call this. otherwise could call resolveAddresses()

  //   if (params.moduleAddress && params.moduleSetupData) {
  //     const result = await addressResolver.read.resolveAddressesFlexibleForV2([
  //       params.eoaAddress,
  //       Number.parseInt(maxIndexForScan.toString()), // TODO: SHOULD BE A BIGINT BUT REQUIRED TO BE A NUMBER FOR THE CONTRACT
  //       params.moduleAddress,
  //       params.moduleSetupData
  //     ])

  //     const desiredV1Account = result.find(
  //       (smartAccountInfo: {
  //         factoryVersion: string
  //         currentVersion: string
  //         deploymentIndex: { toString: () => string }
  //       }) =>
  //         smartAccountInfo.factoryVersion === "v1" &&
  //         smartAccountInfo.currentVersion === "2.0.0" &&
  //         smartAccountInfo.deploymentIndex === params.index
  //     )

  //     if (desiredV1Account) {
  //       const smartAccountAddress = desiredV1Account.accountAddress
  //       return smartAccountAddress
  //     }
  //     return ADDRESS_ZERO
  //   }
  //   return ADDRESS_ZERO
  // }

  /**
   * Return the value to put into the "initCode" field, if the account is not yet deployed.
   * This value holds the "factory" address, followed by this account's information
   */
  public override async getAccountInitCode(): Promise<Hex> {
    this.isDefaultValidationModuleDefined()

    if (await this.isAccountDeployed()) return "0x"

    const factoryData = (await this.getFactoryData()) as Hex
    return concatHex([this.factoryAddress, factoryData])
  }

  /**
   *
   * @param to { target } address of transaction
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns encoded data for execute function
   */
  async encodeExecute(transaction: Transaction): Promise<Hex> {
    const mode = EXECUTE_SINGLE
    const executionCalldata = encodePacked(
      ["address", "uint256", "bytes"],
      [
        transaction.to as Hex,
        BigInt(transaction.value ?? 0n),
        (transaction.data as Hex) ?? ("0x" as Hex)
      ]
    )
    return encodeFunctionData({
      abi: parseAbi([
        "function execute(bytes32 mode, bytes calldata executionCalldata) external"
      ]),
      functionName: "execute",
      args: [mode, executionCalldata]
    })
  }

  /**
   *
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns encoded data for executeBatch function
   */
  async encodeExecuteBatch(transactions: Transaction[]): Promise<Hex> {
    // return accountContract.interface.encodeFunctionData("execute_ncC", [to, value, data]) as Hex;
    const mode = EXECUTE_BATCH
    // TODO: Use viem instead of ethers
    const execs: { target: Hex; value: bigint; callData: Hex }[] = []
    for (const tx of transactions) {
      execs.push({
        target: tx.to as Hex,
        callData: (tx.data ?? "0x") as Hex,
        value: BigInt(tx.value ?? 0n)
      })
    }
    const executionCalldataPrep = ethers.AbiCoder.defaultAbiCoder().encode(
      [Executions],
      [execs]
    ) as Hex

    return encodeFunctionData({
      abi: parseAbi([
        "function execute(bytes32 mode, bytes calldata executionCalldata) external"
      ]),
      functionName: "execute",
      args: [mode, executionCalldataPrep]
    })
  }

  // dummy signature depends on the validation module supplied.
  async getDummySignatures(): Promise<Hex> {
    // const params = { ...(this.sessionData ? this.sessionData : {}), ..._params }
    this.isActiveValidationModuleDefined()
    return this.activeValidationModule.getDummySignature() as Hex
  }

  // TODO: review this
  getDummySignature(): Hex {
    throw new Error("Method not implemented! Call getDummySignatures instead.")
  }

  // Might use provided paymaster instance to get dummy data (from pm service)
  getDummyPaymasterData(): string {
    return "0x"
  }

  validateUserOp(
    // userOp: Partial<UserOperationStruct>,
    // requiredFields: UserOperationKey[]
  ): boolean {
    // console.log(userOp, "userOp");
    // for (const field of requiredFields) {
    //   if (isNullOrUndefined(userOp[field])) {
    //     throw new Error(`${String(field)} is missing in the UserOp`)
    //   }
    // }
    return true
  }

  async signUserOp(
    userOp: Partial<UserOperationStruct>
  ): Promise<UserOperationStruct> {
    this.isActiveValidationModuleDefined()
    const userOpHash = await this.getUserOpHash(userOp)
    const eoaSignature =
      await this.activeValidationModule.signUserOpHash(userOpHash)
    userOp.signature = eoaSignature
    return userOp as UserOperationStruct
  }

  getSignatureWithModuleAddress(
    moduleSignature: Hex,
    moduleAddress?: Hex
  ): Hex {
    const moduleAddressToUse =
      moduleAddress ?? (this.activeValidationModule.getAddress() as Hex)
    return encodePacked(
      ["address", "bytes"],
      [moduleAddressToUse, moduleSignature]
    )
  }

  private async getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperationStruct>,
    feeQuotesOrData: FeeQuotesOrDataDto
  ): Promise<FeeQuotesOrDataResponse> {
    const paymaster = this
      .paymaster as IHybridPaymaster<PaymasterUserOperationDto>
    const tokenList = feeQuotesOrData?.preferredToken
      ? [feeQuotesOrData?.preferredToken]
      : feeQuotesOrData?.tokenList?.length
        ? feeQuotesOrData?.tokenList
        : []
    return paymaster.getPaymasterFeeQuotesOrData(userOp, {
      ...feeQuotesOrData,
      tokenList
    })
  }

  /**
   *
   * @description This function will retrieve fees from the paymaster in erc20 mode
   *
   * @param manyOrOneTransactions Array of {@link Transaction} to be batched and sent. Can also be a single {@link Transaction}.
   * @param buildUseropDto {@link BuildUserOpOptions}.
   * @returns Promise<FeeQuotesOrDataResponse>
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl }); // Retrieve bundler url from dashboard
   * const encodedCall = encodeFunctionData({
   *   abi: parseAbi(["function safeMint(address to) public"]),
   *   functionName: "safeMint",
   *   args: ["0x..."],
   * });
   *
   * const transaction = {
   *   to: nftAddress,
   *   data: encodedCall
   * }
   *
   * const feeQuotesResponse: FeeQuotesOrDataResponse = await smartAccount.getTokenFees(transaction, { paymasterServiceData: { mode: PaymasterMode.ERC20 } });
   *
   * const userSeletedFeeQuote = feeQuotesResponse.feeQuotes?.[0];
   *
   * const { wait } = await smartAccount.sendTransaction(transaction, {
   *    paymasterServiceData: {
   *      mode: PaymasterMode.ERC20,
   *      feeQuote: userSeletedFeeQuote,
   *      spender: feeQuotesResponse.tokenPaymasterAddress,
   *    },
   * });
   *
   * const { success, receipt } = await wait();
   *
   */
  public async getTokenFees(
    manyOrOneTransactions: Transaction | Transaction[],
    buildUseropDto: BuildUserOpOptions
  ): Promise<FeeQuotesOrDataResponse> {
    const txs = Array.isArray(manyOrOneTransactions)
      ? manyOrOneTransactions
      : [manyOrOneTransactions]
    const userOp = await this.buildUserOp(txs, buildUseropDto)
    if (!buildUseropDto.paymasterServiceData)
      throw new Error("paymasterServiceData was not provided")
    return this.getPaymasterFeeQuotesOrData(
      userOp,
      buildUseropDto.paymasterServiceData
    )
  }

  /**
   *
   * @description This function will return an array of supported tokens from the erc20 paymaster associated with the Smart Account
   * @returns Promise<{@link SupportedToken}>
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, biconomyPaymasterApiKey }); // Retrieve bundler url from dashboard
   * const tokens = await smartAccount.getSupportedTokens();
   *
   * // [
   * //   {
   * //     symbol: "USDC",
   * //     tokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
   * //     decimal: 6,
   * //     logoUrl: "https://assets.coingecko.com/coins/images/279/large/usd-coin.png?1595353707",
   * //     premiumPercentage: 0.1,
   * //   }
   * // ]
   *
   */
  public async getSupportedTokens(): Promise<SupportedToken[]> {
    const feeQuotesResponse = await this.getTokenFees(
      {
        data: "0x",
        value: BigInt(0),
        to: await this.getAddress()
      },
      {
        paymasterServiceData: { mode: PaymasterMode.ERC20 }
      }
    )

    return await Promise.all(
      (feeQuotesResponse?.feeQuotes ?? []).map(async (quote) => {
        const [tokenBalance] = await this.getBalances([
          quote.tokenAddress as Hex
        ])
        return {
          symbol: quote.symbol,
          tokenAddress: quote.tokenAddress,
          decimal: quote.decimal,
          logoUrl: quote.logoUrl,
          premiumPercentage: quote.premiumPercentage,
          balance: tokenBalance
        }
      })
    )
  }

  /**
   *
   * @param userOp
   * @param params
   * @description This function will take a user op as an input, sign it with the owner key, and send it to the bundler.
   * @returns Promise<Hash>
   * Sends a user operation
   *
   * - Docs: https://docs.biconomy.io/Account/transactions/userpaid#send-useroperation
   *
   * @param userOp Partial<{@link UserOperationStruct}> the userOp params to be sent.
   * @param params {@link SendUserOpParams}.
   * @returns Promise<{@link Hash}> that you can use to track the user operation.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl }); // Retrieve bundler url from dashboard
   * const encodedCall = encodeFunctionData({
   *   abi: parseAbi(["function safeMint(address to) public"]),
   *   functionName: "safeMint",
   *   args: ["0x..."],
   * });
   *
   * const transaction = {
   *   to: nftAddress,
   *   data: encodedCall
   * }
   *
   * const userOp = await smartAccount.buildUserOp([transaction]);
   *
   * const { wait } = await smartAccount.sendUserOp(userOp);
   * const { success, receipt } = await wait();
   *
   */
  async sendUserOp(
    userOp: Partial<UserOperationStruct>
  ): Promise<UserOpResponse> {
    const { signature, ...rest } = userOp // signature will be set when signing the userOp
    const signedUserOp = await this.signUserOp(rest)
    const bundlerResponse = await this.sendSignedUserOp(signedUserOp)

    return bundlerResponse
  }

  /**
   *
   * @param userOp - The signed user operation to send
   * @param simulationType - The type of simulation to perform ("validation" | "validation_and_execution")
   * @description This function call will take 'signedUserOp' as input and send it to the bundler
   * @returns
   */
  async sendSignedUserOp(userOp: UserOperationStruct): Promise<UserOpResponse> {
    // TODO REMOVE COMMENT AND CHECK FOR PIMLICO USER OP FIELDS
    // const requiredFields: UserOperationKey[] = [
    //   "sender",
    //   "nonce",
    //   "verificationGasLimit",
    //   "preVerificationGas",
    //   "maxFeePerGas",
    //   "maxPriorityFeePerGas",
    //   "signature",
    // ]
    // this.validateUserOp(userOp, requiredFields)
    if (!this.bundler) throw new Error("Bundler is not provided")
    return await this.bundler.sendUserOp(userOp)
  }

  /**
   * Packs gas values into the format required by PackedUserOperation.
   * @param callGasLimit Call gas limit.
   * @param verificationGasLimit Verification gas limit.
   * @param maxFeePerGas Maximum fee per gas.
   * @param maxPriorityFeePerGas Maximum priority fee per gas.
   * @returns An object containing packed gasFees and accountGasLimits.
   */
  public packGasValues(
    callGasLimit: BigNumberish,
    verificationGasLimit: BigNumberish,
    maxFeePerGas: BigNumberish,
    maxPriorityFeePerGas: BigNumberish
  ) {
    const gasFees = ethers.solidityPacked(
      ["uint128", "uint128"],
      [maxPriorityFeePerGas, maxFeePerGas]
    ) as Hex
    const accountGasLimits = ethers.solidityPacked(
      ["uint128", "uint128"],
      [callGasLimit, verificationGasLimit]
    ) as Hex

    return { gasFees, accountGasLimits }
  }

  async getUserOpHash(userOp: Partial<UserOperationStruct>): Promise<Hex> {
    const packedUserOp = packUserOp(userOp)
    const userOpHash = keccak256(packedUserOp as Hex)
    const enc = encodeAbiParameters(
      parseAbiParameters("bytes32, address, uint256"),
      [userOpHash, this.entryPoint.address, BigInt(this.chainId)]
    )
    return keccak256(enc)
  }

  async estimateUserOpGas(
    userOp: Partial<UserOperationStruct>,
    stateOverrideSet?: StateOverrideSet
  ): Promise<Partial<UserOperationStruct>> {
    if (!this.bundler) throw new Error("Bundler is not provided")
    const finalUserOp = userOp

    if (!userOp.maxFeePerGas && !userOp.maxPriorityFeePerGas) {
      const feeData = await this.publicClient.estimateFeesPerGas()
      if (feeData.maxFeePerGas?.toString()) {
        finalUserOp.maxFeePerGas = feeData.maxFeePerGas
      } else if (feeData.gasPrice?.toString()) {
        finalUserOp.maxFeePerGas = feeData.gasPrice
      } else {
        finalUserOp.maxFeePerGas = await this.publicClient.getGasPrice()
      }

      if (feeData.maxPriorityFeePerGas?.toString()) {
        finalUserOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      } else if (feeData.gasPrice?.toString()) {
        finalUserOp.maxPriorityFeePerGas = feeData.gasPrice ?? 0n
      } else {
        finalUserOp.maxPriorityFeePerGas = await this.publicClient.getGasPrice()
      }
    }

    const { callGasLimit, verificationGasLimit, preVerificationGas } =
      await this.bundler.estimateUserOpGas(userOp, stateOverrideSet)
    finalUserOp.verificationGasLimit =
      verificationGasLimit ?? userOp.verificationGasLimit
    finalUserOp.callGasLimit = callGasLimit ?? userOp.callGasLimit
    finalUserOp.preVerificationGas =
      preVerificationGas ?? userOp.preVerificationGas

    return finalUserOp
  }

  override async getNonce(
    validationMode?: typeof MODE_VALIDATION | typeof MODE_MODULE_ENABLE
  ): Promise<bigint> {
    try {
      const vm =
        this.activeValidationModule.moduleAddress ??
        this.defaultValidationModule.moduleAddress
      const key = concat(["0x000000", validationMode ?? MODE_VALIDATION, vm])
      const accountAddress = await this.getAddress()
      return (await this.entryPoint.read.getNonce([
        accountAddress,
        BigInt(key)
      ])) as bigint
    } catch (e) {
      return BigInt(0)
    }
  }

  private async getBuildUserOpNonce(
    nonceOptions: NonceOptions | undefined
  ): Promise<bigint> {
    let nonce = BigInt(0)
    try {
      if (nonceOptions?.nonceOverride) {
        nonce = BigInt(nonceOptions?.nonceOverride)
      } else {
        nonce = await this.getNonce(nonceOptions?.validationMode)
      }
    } catch (error) {
      // Not throwing this error as nonce would be 0 if this.getNonce() throw exception, which is expected flow for undeployed account
      Logger.warn(
        "Error while getting nonce for the account. This is expected for undeployed accounts set nonce to 0"
      )
    }
    return nonce
  }

  /**
   * Transfers ownership of the smart account to a new owner.
   * @param newOwner The address of the new owner.
   * @param moduleAddress {@link TransferOwnershipCompatibleModule} The address of the validation module (ECDSA Ownership Module or Multichain Validation Module).
   * @param buildUseropDto {@link BuildUserOpOptions}. Optional parameter
   * @returns A Promise that resolves to a Hash or rejects with an Error.
   * @description This function will transfer ownership of the smart account to a new owner. If you use session key manager module, after transferring the ownership
   * you will need to re-create a session for the smart account with the new owner (signer) and specify "accountAddress" in "createSmartAccountClient" function.
   * @example
   * ```typescript
   * 
   * let walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      });

      let smartAccount = await createSmartAccountClient({
        signer: walletClient,
        paymasterUrl: "https://paymaster.biconomy.io/api/v1/...",
        bundlerUrl: `https://bundler.biconomy.io/api/v2/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
        chainId: 84532
      });
      const response = await smartAccount.transferOwnership(newOwner, DEFAULT_ECDSA_OWNERSHIP_MODULE, {paymasterServiceData: {mode: PaymasterMode.SPONSORED}});
      
      walletClient = createWalletClient({
        newOwnerAccount,
        chain: baseSepolia,
        transport: http()
      })
      
      smartAccount = await createSmartAccountClient({
        signer: walletClient,
        paymasterUrl: "https://paymaster.biconomy.io/api/v1/...",
        bundlerUrl: `https://bundler.biconomy.io/api/v2/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
        chainId: 84532,
        accountAddress: await smartAccount.getAddress()
      })
   * ```
   */
  async transferOwnership(
    newOwner: Address,
    moduleAddress: TransferOwnershipCompatibleModule,
    buildUseropDto?: BuildUserOpOptions
  ): Promise<UserOpResponse> {
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function transferOwnership(address newOwner) public"]),
      functionName: "transferOwnership",
      args: [newOwner]
    })
    const transaction = {
      to: moduleAddress,
      data: encodedCall
    }
    const userOpResponse: UserOpResponse = await this.sendTransaction(
      transaction,
      buildUseropDto
    )
    return userOpResponse
  }

  /**
   * Sends a transaction (builds and sends a user op in sequence)
   *
   * - Docs: https://docs.biconomy.io/Account/transactions/userpaid#send-transaction
   *
   * @param manyOrOneTransactions Array of {@link Transaction} to be batched and sent. Can also be a single {@link Transaction}.
   * @param buildUseropDto {@link BuildUserOpOptions}.
   * @returns Promise<{@link Hash}> that you can use to track the user operation.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl }); // Retrieve bundler url from dashboard
   * const encodedCall = encodeFunctionData({
   *   abi: parseAbi(["function safeMint(address to) public"]),
   *   functionName: "safeMint",
   *   args: ["0x..."],
   * });
   *
   * const transaction = {
   *   to: nftAddress,
   *   data: encodedCall
   * }
   *
   * const { waitForTxHash } = await smartAccount.sendTransaction(transaction);
   * const { transactionHash, userOperationReceipt } = await wait();
   *
   *  @remarks
   * This example shows how to increase the estimated gas values for a transaction using `gasOffset` parameter.
   *  @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl }); // Retrieve bundler url from dashboard
   * const encodedCall = encodeFunctionData({
   *   abi: parseAbi(["function safeMint(address to) public"]),
   *   functionName: "safeMint",
   *   args: ["0x..."],
   * });
   *
   * const transaction = {
   *   to: nftAddress,
   *   data: encodedCall
   * }
   *
   * const { waitForTxHash } = await smartAccount.sendTransaction(transaction, {
   *  gasOffset: {
   *      verificationGasLimitOffsetPct: 25, // 25% increase for the already estimated gas limit
   *      preVerificationGasOffsetPct: 10 // 10% increase for the already estimated gas limit
   *     }
   * });
   * const { transactionHash, userOperationReceipt } = await wait();
   *
   */
  async sendTransaction(
    manyOrOneTransactions: Transaction | Transaction[],
    buildUseropDto?: BuildUserOpOptions
  ): Promise<UserOpResponse> {
    const userOp = await this.buildUserOp(
      Array.isArray(manyOrOneTransactions)
        ? manyOrOneTransactions
        : [manyOrOneTransactions],
      buildUseropDto
    )
    return this.sendUserOp(userOp)
  }

  async sendTransactionWithExecutor(
    manyOrOneTransactions: Transaction | Transaction[],
    ownedAccountAddress?: Address
    // buildUseropDto?: BuildUserOpOptions
  ): Promise<UserOpReceipt> {
    return await this.executeFromExecutor(
      Array.isArray(manyOrOneTransactions)
        ? manyOrOneTransactions
        : [manyOrOneTransactions],
      ownedAccountAddress
      // buildUseropDto
    )
  }

  /**
   * Builds a user operation
   *
   * This method will also simulate the validation and execution of the user operation, telling the user if the user operation will be successful or not.
   *
   * - Docs: https://docs.biconomy.io/Account/transactions/userpaid#build-useroperation
   *
   * @param transactions Array of {@link Transaction} to be sent.
   * @param buildUseropDto {@link BuildUserOpOptions}.
   * @returns Promise<Partial{@link UserOperationStruct}>> the built user operation to be sent.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl }); // Retrieve bundler url from dashboard
   * const encodedCall = encodeFunctionData({
   *   abi: parseAbi(["function safeMint(address to) public"]),
   *   functionName: "safeMint",
   *   args: ["0x..."],
   * });
   *
   * const transaction = {
   *   to: nftAddress,
   *   data: encodedCall
   * }
   *
   * const userOp = await smartAccount.buildUserOp([{ to: "0x...", data: encodedCall }]);
   *
   */
  async buildUserOp(
    transactions: Transaction[],
    buildUseropDto?: BuildUserOpOptions
  ): Promise<Partial<UserOperationStruct>> {
    const dummySignatureFetchPromise = this.getDummySignatures()
    const [nonceFromFetch, dummySignature] = await Promise.all([
      this.getBuildUserOpNonce(buildUseropDto?.nonceOptions),
      dummySignatureFetchPromise
    ])

    if (transactions.length === 0) {
      throw new Error("Transactions array cannot be empty")
    }
    let callData: Hex = "0x"
    if (!buildUseropDto?.useEmptyDeployCallData) {
      if (transactions.length > 1 || buildUseropDto?.forceEncodeForBatch) {
        callData = await this.encodeExecuteBatch(transactions)
      } else {
        callData = await this.encodeExecute(transactions[0])
      }
    }

    const factoryData = await this.getFactoryData()
    let userOp: Partial<UserOperationStruct> = {
      sender: (await this.getAddress()) as Hex,
      nonce: nonceFromFetch,
      factoryData,
      factory: (await this.isAccountDeployed())
        ? undefined
        : this.factoryAddress,
      callData
    }

    userOp.signature = dummySignature

    if (!buildUseropDto?.skipBundler) {
      const gasFeeValues: GetUserOperationGasPriceReturnType | undefined =
        await this.bundler?.getGasFeeValues()

      userOp.maxFeePerGas = gasFeeValues?.fast.maxFeePerGas ?? 0n
      userOp.maxPriorityFeePerGas =
        gasFeeValues?.fast.maxPriorityFeePerGas ?? 0n
    }

    userOp = await this.estimateUserOpGas(userOp)

    return userOp
  }

  private validateUserOpAndPaymasterRequest(
    userOp: Partial<UserOperationStruct>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest
  ): void {
    if (isNullOrUndefined(userOp.callData)) {
      throw new Error("UserOp callData cannot be undefined")
    }

    const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress
    Logger.warn("Requested fee token is ", feeTokenAddress)

    if (!feeTokenAddress || feeTokenAddress === ADDRESS_ZERO) {
      throw new Error(
        "Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest"
      )
    }

    const spender = tokenPaymasterRequest?.spender
    Logger.warn("Spender address is ", spender)

    if (!spender || spender === ADDRESS_ZERO) {
      throw new Error(
        "Invalid or missing spender address. Sepnder address must be part of tokenPaymasterRequest"
      )
    }
  }

  /**
   *
   * @param userOp partial user operation without signature and paymasterAndData
   * @param tokenPaymasterRequest This dto provides information about fee quote. Fee quote is received from earlier request getFeeQuotesOrData() to the Biconomy paymaster.
   *  maxFee and token decimals from the quote, along with the spender is required to append approval transaction.
   * @notice This method should be called when gas is paid in ERC20 token using TokenPaymaster
   * @description Optional method to update the userOp.calldata with batched transaction which approves the paymaster spender with necessary amount(if required)
   * @returns updated userOp with new callData, callGasLimit
   */
  async buildTokenPaymasterUserOp(
    userOp: Partial<UserOperationStruct>,
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest
  ): Promise<Partial<UserOperationStruct>> {
    this.validateUserOpAndPaymasterRequest(userOp, tokenPaymasterRequest)
    try {
      Logger.warn(
        "Received information about fee token address and quote ",
        tokenPaymasterRequest.toString()
      )

      if (this.paymaster && this.paymaster instanceof Paymaster) {
        // Make a call to paymaster.buildTokenApprovalTransaction() with necessary details

        // Review: might request this form of an array of Transaction
        const approvalRequest: Transaction = await (
          this.paymaster as IHybridPaymaster<SponsorUserOperationDto>
        ).buildTokenApprovalTransaction(tokenPaymasterRequest)
        Logger.warn("ApprovalRequest is for erc20 token ", approvalRequest.to)

        if (
          approvalRequest.data === "0x" ||
          approvalRequest.to === ADDRESS_ZERO
        ) {
          return userOp
        }

        if (isNullOrUndefined(userOp.callData)) {
          throw new Error("UserOp callData cannot be undefined")
        }

        const decodedSmartAccountData = decodeFunctionData({
          abi: NexusAbi,
          data: (userOp.callData as Hex) ?? "0x"
        })

        if (!decodedSmartAccountData) {
          throw new Error(
            "Could not parse userOp call data for this smart account"
          )
        }

        const smartAccountExecFunctionName =
          decodedSmartAccountData.functionName

        Logger.warn(
          `Originally an ${smartAccountExecFunctionName} method call for Biconomy Account V2`
        )

        const initialTransaction: Transaction = {
          to: "0x",
          data: "0x",
          value: 0n
        }
        if (
          smartAccountExecFunctionName === "execute" ||
          smartAccountExecFunctionName === "executeFromExecutor"
        ) {
          const methodArgsSmartWalletExecuteCall =
            decodedSmartAccountData.args ?? []
          const toOriginal =
            (methodArgsSmartWalletExecuteCall[0] as Hex) ?? "0x"
          const valueOriginal = methodArgsSmartWalletExecuteCall[1] ?? 0n
          // @ts-ignore
          const dataOriginal = methodArgsSmartWalletExecuteCall?.[2] ?? "0x"

          initialTransaction.to = toOriginal
          initialTransaction.value = valueOriginal
          initialTransaction.data = dataOriginal
        } else {
          throw new Error(
            `Unsupported method call: ${smartAccountExecFunctionName}`
          )
        }

        const finalUserOp: Partial<UserOperationStruct> = {
          ...userOp,
          callData: await this.encodeExecuteBatch([
            approvalRequest,
            initialTransaction
          ])
        }

        return finalUserOp
      }
    } catch (error) {
      Logger.log("Failed to update userOp. Sending back original op")
      Logger.error(
        "Failed to update callData with error",
        JSON.stringify(error)
      )
      return userOp
    }
    return userOp
  }

  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<Hex> {
    this.isActiveValidationModuleDefined()
    const moduleSig = (await this.signUserOpHash(userOpHash, params)) as Hex

    return moduleSig
  }

  /**
   * Deploys the smart contract
   *
   * This method will deploy a Smart Account contract. It is useful for deploying in a moment when you know that gas prices are low,
   * and you want to deploy the account before sending the first user operation. This step can otherwise be skipped,
   * as the deployment will alternatively be bundled with the first user operation.
   *
   * @param buildUseropDto {@link BuildUserOpOptions}.
   * @returns Promise<{@link Hash}> that you can use to track the user operation.
   * @error Throws an error if the account has already been deployed.
   * @error Throws an error if the account has not enough native token balance to deploy, if not using a paymaster.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const smartAccount = await createSmartAccountClient({
   *  signer,
   *  biconomyPaymasterApiKey,
   *  bundlerUrl
   * });
   *
   * // If you want to use a paymaster...
   * const { wait } = await smartAccount.deploy({
   *   paymasterServiceData: { mode: PaymasterMode.SPONSORED },
   * });
   *
   * // Or if you can't use a paymaster send native token to this address:
   * const counterfactualAddress = await smartAccount.getAddress();
   *
   * // Then deploy the account
   * const { wait } = await smartAccount.deploy();
   *
   * const { success, receipt } = await wait();
   *
   */
  public async deploy(
    buildUseropDto?: BuildUserOpOptions
  ): Promise<UserOpResponse> {
    const accountAddress = this.accountAddress ?? (await this.getAddress())

    // Check that the account has not already been deployed
    const byteCode = await this.publicClient?.getBytecode({
      address: accountAddress as Hex
    })

    if (byteCode !== undefined) {
      throw new Error(ERROR_MESSAGES.ACCOUNT_ALREADY_DEPLOYED)
    }

    // Check that the account has enough native token balance to deploy, if not using a paymaster
    if (!buildUseropDto?.paymasterServiceData?.mode) {
      const nativeTokenBalance = await this.publicClient?.getBalance({
        address: accountAddress
      })

      if (nativeTokenBalance === BigInt(0)) {
        throw new Error(ERROR_MESSAGES.NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY)
      }
    }

    const useEmptyDeployCallData = true

    return this.sendTransaction(
      {
        to: accountAddress,
        data: "0x"
      },
      { ...buildUseropDto, useEmptyDeployCallData }
    )
  }

  async getFactoryData() {
    if (await this.isAccountDeployed()) return undefined
    this.isDefaultValidationModuleDefined()

    const signerAddress = await this.signer.getAddress()

    return encodeFunctionData({
      abi: contracts.K1ValidatorFactory.abi,
      functionName: "createAccount",
      args: [signerAddress, this.index, [], 0]
    })
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    let signature: Hex
    this.isActiveValidationModuleDefined()
    const dataHash = typeof message === "string" ? toBytes(message) : message

    signature =
      (await this.activeValidationModule.signMessage(dataHash)) ??
      this.defaultValidationModule.signMessage(dataHash)
    signature = encodePacked(
      ["address", "bytes"],
      [
        this.activeValidationModule.getAddress() ??
          this.defaultValidationModule.getAddress(),
        signature
      ]
    )
    if (await this.isAccountDeployed()) {
      return signature
    }
    // If the account is not deployed, follow ERC 6492
    const abiEncodedMessage = encodeAbiParameters(
      [
        {
          type: "address",
          name: "create2Factory"
        },
        {
          type: "bytes",
          name: "factoryCalldata"
        },
        {
          type: "bytes",
          name: "originalERC1271Signature"
        }
      ],
      [
        this.getFactoryAddress() ?? "0x",
        (await this.getFactoryData()) ?? "0x",
        signature
      ]
    )
    return concat([abiEncodedMessage, MAGIC_BYTES])
  }

  async getIsValidSignatureData(
    messageHash: Hex,
    signature: Hex
  ): Promise<Hex> {
    return encodeFunctionData({
      abi: NexusAbi,
      functionName: "isValidSignature",
      args: [messageHash, signature]
    })
  }

  async isModuleInstalled(module: Module) {
    if (await this.isAccountDeployed()) {
      const accountContract = await this._getAccountContract()
      return (await accountContract.read.isModuleInstalled([
        BigInt(moduleTypeIds[module.type]),
        module.moduleAddress,
        module.data ?? "0x"
      ])) as boolean
    }
    Logger.warn("A module cannot be installed on an undeployed account")
    return false
  }

  getSmartAccountOwner(): SmartAccountSigner {
    return this.signer
  }

  async installModule(
    module: Module,
    buildUserOpOptions?: BuildUserOpOptions
  ): Promise<UserOpResponse> {
    let execution: Execution
    switch (module.type) {
      case "validator":
      case "executor":
      case "hook":
        execution = await this._installModule({
          moduleAddress: module.moduleAddress,
          type: module.type,
          data: module.data
        })
        return this.sendTransaction(
          {
            to: execution.target,
            data: execution.callData,
            value: execution.value
          },
          buildUserOpOptions
        )
      case "fallback":
        if (!module.selector || !module.callType) {
          throw new Error(
            "Selector param is required for a Fallback Handler Module"
          )
        }
        execution = await this._uninstallFallback(module)
        return this.sendTransaction(
          {
            to: execution.target,
            data: execution.callData,
            value: execution.value
          },
          buildUserOpOptions
        )
      default:
        throw new Error(`Unknown module type ${module.type}`)
    }
  }

  async _installModule(module: Module): Promise<Execution> {
    const isInstalled = await this.isModuleInstalled(module)

    if (!isInstalled) {
      const execution = {
        target: await this.getAddress(),
        value: BigInt(0),
        callData: encodeFunctionData({
          functionName: "installModule",
          abi: parseAbi([
            "function installModule(uint256 moduleTypeId, address module, bytes calldata initData) external payable"
          ]),
          args: [
            BigInt(moduleTypeIds[module.type]),
            module.moduleAddress,
            module.data || "0x"
          ]
        })
      }
      return execution
    }
    throw new Error("Module already installed")
  }

  async uninstallModule(
    module: Module,
    buildUserOpOptions?: BuildUserOpOptions
  ): Promise<UserOpResponse> {
    let execution: Execution
    switch (module.type) {
      case "validator":
      case "executor":
      case "hook":
        execution = await this._uninstallModule(module)
        return await this.sendTransaction(
          {
            to: execution.target,
            data: execution.callData,
            value: execution.value
          },
          buildUserOpOptions
        )
      case "fallback":
        if (!module.selector) {
          throw new Error(
            `Selector param is required for module type ${module.type}`
          )
        }
        execution = await this._uninstallFallback(module)
        return await this.sendTransaction(
          {
            to: execution.target,
            data: execution.callData,
            value: execution.value
          },
          buildUserOpOptions
        )
      default:
        throw new Error(`Unknown module type ${module.type}`)
    }
  }

  private _getModuleIndex(
    installedModules:
      | Awaited<ReturnType<typeof this.getInstalledValidators>>
      | Awaited<ReturnType<typeof this.getInstalledExecutors>>,
    module: Module
  ): Hex {
    const index = installedModules.indexOf(getAddress(module.moduleAddress))
    if (index === 0) {
      return SENTINEL_ADDRESS
    }
    if (index > 0) {
      // @ts-ignore: TODO: Gabi This looks wrong
      return installedModules[index - 1]
    }
    throw new Error(
      `Module ${module.moduleAddress} not found in installed modules`
    )
  }

  async getPreviousModule(module: Module) {
    if (module.type === "validator") {
      const installedModules = await this.getInstalledValidators()
      return this._getModuleIndex(installedModules, module)
    }
    if (module.type === "executor") {
      const installedModules = await this.getInstalledExecutors()
      return this._getModuleIndex(installedModules, module)
    }
    throw new Error(`Unknown module type ${module.type}`)
  }

  private async _uninstallFallback(module: Module): Promise<Execution> {
    let execution: Execution

    const isInstalled = await this.isModuleInstalled(module)

    if (isInstalled) {
      execution = {
        target: await this.getAddress(),
        value: BigInt(0),
        callData: encodeFunctionData({
          functionName: "uninstallModule",
          abi: parseAbi([
            "function uninstallModule(uint256 moduleTypeId, address module, bytes deInitData)"
          ]),
          args: [
            BigInt(moduleTypeIds[module.type]),
            module.moduleAddress,
            encodePacked(
              ["bytes4", "bytes"],
              [module.selector ?? "0x", module.data ?? "0x"]
            )
          ]
        })
      }
      return execution
    }
    throw new Error("Module is not installed")
  }

  private async _uninstallModule(module: Module): Promise<Execution> {
    let execution: Execution
    const isInstalled = await this.isModuleInstalled(module)

    if (isInstalled) {
      let moduleData = module.data || "0x"
      if (module.type === "validator" || module.type === "executor") {
        const prev = await this.getPreviousModule(module)
        moduleData = encodeAbiParameters(
          [
            { name: "prev", type: "address" },
            { name: "disableModuleData", type: "bytes" }
          ],
          [prev, moduleData]
        )
      }
      execution = {
        target: await this.getAddress(),
        value: BigInt(0),
        callData: encodeFunctionData({
          functionName: "uninstallModule",
          abi: parseAbi([
            "function uninstallModule(uint256 moduleTypeId, address module, bytes deInitData)"
          ]),
          args: [
            BigInt(moduleTypeIds[module.type]),
            module.moduleAddress,
            moduleData
          ]
        })
      }
      return execution
    }
    throw new Error("Module is not installed")
  }

  private async executeFromExecutor(
    transactions: Transaction[],
    ownedAccountAddress?: Address
    // buildUseropDto?: BuildUserOpOptions
  ): Promise<UserOpReceipt> {
    if (this.activeExecutionModule) {
      if (transactions.length > 1) {
        const executions: { target: Hex; value: bigint; callData: Hex }[] =
          transactions.map((tx) => {
            return {
              target: tx.to as Hex,
              callData: (tx.data ?? "0x") as Hex,
              value: BigInt(tx.value ?? 0n)
            }
          })
        return await this.activeExecutionModule?.execute(
          executions,
          ownedAccountAddress
        )
      }
      const execution = {
        target: transactions[0].to as Hex,
        callData: (transactions[0].data ?? "0x") as Hex,
        value: BigInt(transactions[0].value ?? 0n)
      }
      return await this.activeExecutionModule.execute(
        execution,
        ownedAccountAddress
      )
    }
    throw new Error(
      "Please set an active executor module before running this method."
    )
  }

  /**
   * Checks if the account contract supports a specific execution mode.
   * @param mode - The execution mode to check, represented as a viem Address.
   * @returns A promise that resolves to a boolean indicating whether the execution mode is supported.
   */
  async supportsExecutionMode(mode: Address): Promise<boolean> {
    const accountContract = await this._getAccountContract()
    return (await accountContract.read.supportsExecutionMode([mode])) as boolean
  }

  async getInstalledValidators() {
    const accountContract = await this._getAccountContract()
    return await accountContract.read.getValidatorsPaginated([
      SENTINEL_ADDRESS,
      100n
    ])
  }

  async getInstalledExecutors() {
    const accountContract = await this._getAccountContract()
    return await accountContract.read.getExecutorsPaginated([
      SENTINEL_ADDRESS,
      100n
    ])
  }

  /**
   * Retrieves all installed modules for the account, including validators, executors, active hook, and fallback handler.
   * @returns A promise that resolves to an array of addresses representing all installed modules.
   */
  async getInstalledModules() {
    const validators = await this.getInstalledValidators()
    const executors = await this.getInstalledExecutors()
    const hook = await this.getActiveHook()
    const fallbackHandler = await this.getFallbackBySelector()
    return [...validators, ...executors, hook, fallbackHandler]
  }

  /**
   * Retrieves the active hook for the account.
   * @returns A promise that resolves to the address of the active hook.
   */
  async getActiveHook() {
    const accountContract = await this._getAccountContract()
    return await accountContract.read.getActiveHook()
  }

  /**
   * Retrieves the fallback handler for a given selector.
   * @param selector - Optional hexadecimal selector. If not provided, uses a generic fallback selector.
   * @returns A promise that resolves to the address of the fallback handler.
   */
  async getFallbackBySelector(selector?: Hex) {
    const accountContract = await this._getAccountContract()
    return await accountContract.read.getFallbackHandlerBySelector([
      selector ?? GENERIC_FALLBACK_SELECTOR
    ])
  }

  /**
   * Checks if the account supports a specific module type.
   * @param moduleType - The type of module to check for support.
   * @returns A promise that resolves to a boolean indicating whether the module type is supported.
   */
  async supportsModule(module: Module): Promise<boolean> {
    const accountContract = await this._getAccountContract()
    const moduleIndex =
      module.type === "validator"
        ? 1n
        : module.type === "executor"
          ? 2n
          : module.type === "fallback"
            ? 3n
            : 4n
    return await accountContract.read.supportsModule([moduleIndex])
  }
}
