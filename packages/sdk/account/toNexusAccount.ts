import {
  type AbiParameter,
  type Account,
  type Address,
  type Chain,
  type ClientConfig,
  type Hex,
  type Prettify,
  type RpcSchema,
  type SignableMessage,
  type Transport,
  type TypedData,
  type TypedDataDefinition,
  type UnionPartialBy,
  concat,
  concatHex,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  keccak256,
  parseAbi,
  parseAbiParameters,
  publicActions,
  walletActions
} from "viem"
import {
  type SmartAccount,
  type SmartAccountImplementation,
  type UserOperation,
  entryPoint07Address,
  getUserOperationHash,
  toSmartAccount
} from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import contracts from "../__contracts"
import { EntrypointAbi, K1ValidatorFactoryAbi } from "../__contracts/abi"
import type { Call, GetNonceArgs, UserOperationStruct } from "./utils/Types"

import {
  EXECUTE_BATCH,
  EXECUTE_SINGLE,
  MAGIC_BYTES,
  MODE_VALIDATION
} from "./utils/Constants"

import type { BaseExecutionModule } from "../modules/base/BaseExecutionModule"
import type { BaseValidationModule } from "../modules/base/BaseValidationModule"
import { K1ValidatorModule } from "../modules/validators/K1ValidatorModule"
import { WalletClientSigner } from "./signers/wallet-client"
import { packUserOp } from "./utils/Utils"

export type ToNexusSmartAccountParameters = {
  chain: Chain
  transport: ClientConfig["transport"]
  owner: Account | Address
  index?: bigint | undefined
  activeModule?: BaseValidationModule
  exectutorModule?: BaseExecutionModule
  factoryAddress?: Address
  k1ValidatorAddress?: Address
} & Prettify<
  Pick<
    ClientConfig<Transport, Chain, Account, RpcSchema>,
    | "account"
    | "cacheTime"
    | "chain"
    | "key"
    | "name"
    | "pollingInterval"
    | "rpcSchema"
  >
>

export type NexusAccount = Prettify<
  SmartAccount<NexusSmartAccountImplementation>
>

export type NexusSmartAccountImplementation = SmartAccountImplementation<
  typeof EntrypointAbi,
  "0.7",
  {
    getCounterFactualAddress: () => Promise<Address>
    isDeployed: () => Promise<boolean>
    getInitCode: () => Hex
    encodeExecute: (call: Call) => Promise<Hex>
    encodeExecuteBatch: (calls: readonly Call[]) => Promise<Hex>
    getUserOpHash: (userOp: Partial<UserOperationStruct>) => Promise<Hex>
    factoryData: Hex
    factoryAddress: Address
  }
>

/**
 * Parameters for creating a Nexus Smart Account
 * @typedef {Object} ToNexusSmartAccountParameters
 * @property {Chain} chain - The blockchain network
 * @property {ClientConfig["transport"]} transport - The transport configuration
 * @property {Account | Address} owner - The owner account or address
 * @property {bigint} [index] - Optional index for the account
 * @property {BaseValidationModule} [activeModule] - Optional active validation module
 * @property {BaseExecutionModule} [exectutorModule] - Optional executor module
 * @property {Address} [factoryAddress] - Optional factory address
 * @property {Address} [k1ValidatorAddress] - Optional K1 validator address
 * @property {string} [key] - Optional key for the wallet client
 * @property {string} [name] - Optional name for the wallet client
 */
export const toNexusAccount = async (
  parameters: ToNexusSmartAccountParameters
): Promise<NexusAccount> => {
  const {
    chain,
    transport,
    owner,
    index = 0n,
    activeModule,
    factoryAddress = contracts.k1ValidatorFactory.address,
    k1ValidatorAddress = contracts.k1Validator.address,
    key = "nexus",
    name = "Nexus"
  } = parameters

  const masterClient = createWalletClient({
    account: parseAccount(owner),
    chain,
    transport,
    key,
    name
  })
    .extend(walletActions)
    .extend(publicActions)

  const moduleSigner = new WalletClientSigner(masterClient, "viem")
  const signerAddress = masterClient.account.address
  const entryPointContract = getContract({
    address: contracts.entryPoint.address,
    abi: EntrypointAbi,
    client: {
      public: masterClient,
      wallet: masterClient
    }
  })

  const factoryData = encodeFunctionData({
    abi: K1ValidatorFactoryAbi,
    functionName: "createAccount",
    args: [signerAddress, index, [], 0]
  })

  const defaultedActiveModule =
    activeModule ??
    new K1ValidatorModule(
      {
        address: k1ValidatorAddress,
        type: "validator",
        context: signerAddress,
        additionalContext: "0x"
      },
      moduleSigner
    )

  let _accountAddress: Address
  const getAddress = async () => {
    if (_accountAddress) return _accountAddress
    _accountAddress = (await masterClient.readContract({
      address: factoryAddress,
      abi: K1ValidatorFactoryAbi,
      functionName: "computeAccountAddress",
      args: [signerAddress, index, [], 0]
    })) as Address
    return _accountAddress
  }

  /**
   * Gets the counterfactual address of the account
   * @returns {Promise<Address>} A promise that resolves to the counterfactual address
   * @throws {Error} If unable to get the counterfactual address
   */
  const getCounterFactualAddress = async (): Promise<Address> => {
    try {
      await entryPointContract.simulate.getSenderAddress([getInitCode()])
    } catch (e: any) {
      if (e?.cause?.data?.errorName === "SenderAddressResult") {
        _accountAddress = e?.cause.data.args[0] as Address
        return _accountAddress
      }
    }
    throw new Error("Failed to get counterfactual account address")
  }

  /**
   * Gets the init code for the account
   * @returns {Hex} The init code as a hexadecimal string
   */
  const getInitCode = () => concatHex([factoryAddress, factoryData])

  /**
   * Checks if the account is deployed
   * @returns {Promise<boolean>} A promise that resolves to true if the account is deployed, false otherwise
   */
  const isDeployed = async (): Promise<boolean> => {
    const address = await getCounterFactualAddress()
    const contractCode = await masterClient.getCode({ address })
    return (contractCode?.length ?? 0) > 2
  }

  /**
   * Calculates the hash of a user operation
   * @param {Partial<UserOperationStruct>} userOp - The user operation
   * @returns {Promise<Hex>} A promise that resolves to the hash of the user operation
   */
  const getUserOpHash = async (
    userOp: Partial<UserOperationStruct>
  ): Promise<Hex> => {
    const packedUserOp = packUserOp(userOp)
    const userOpHash = keccak256(packedUserOp as Hex)
    const enc = encodeAbiParameters(
      parseAbiParameters("bytes32, address, uint256"),
      [userOpHash, contracts.entryPoint.address, BigInt(chain.id)]
    )
    return keccak256(enc)
  }

  /**
   * Encodes a batch of calls for execution
   * @param {readonly Call[]} calls - An array of calls to encode
   * @param {Hex} [mode=EXECUTE_BATCH] - The execution mode
   * @returns {Promise<Hex>} A promise that resolves to the encoded calls
   */
  const encodeExecuteBatch = async (
    calls: readonly Call[],
    mode = EXECUTE_BATCH
  ): Promise<Hex> => {
    const executionAbiParams: AbiParameter = {
      type: "tuple[]",
      components: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "callData", type: "bytes" }
      ]
    }

    const executions = calls.map((tx) => ({
      target: tx.to,
      callData: tx.data ?? "0x",
      value: BigInt(tx.value ?? 0n)
    }))

    const executionCalldataPrep = encodeAbiParameters(
      [executionAbiParams],
      [executions]
    )
    return encodeFunctionData({
      abi: parseAbi([
        "function execute(bytes32 mode, bytes calldata executionCalldata) external"
      ]),
      functionName: "execute",
      args: [mode, executionCalldataPrep]
    })
  }

  /**
   * Encodes a single call for execution
   * @param {Call} call - The call to encode
   * @param {Hex} [mode=EXECUTE_SINGLE] - The execution mode
   * @returns {Promise<Hex>} A promise that resolves to the encoded call
   */
  const encodeExecute = async (
    call: Call,
    mode = EXECUTE_SINGLE
  ): Promise<Hex> => {
    const executionCalldata = encodePacked(
      ["address", "uint256", "bytes"],
      [call.to as Hex, BigInt(call.value ?? 0n), (call.data ?? "0x") as Hex]
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
   * Gets the nonce for the account
   * @param {GetNonceArgs} [args] - Optional arguments for getting the nonce
   * @returns {Promise<bigint>} A promise that resolves to the nonce
   */
  const getNonce = async ({
    validationMode: _validationMode = MODE_VALIDATION,
    nonceOptions
  }: GetNonceArgs = {}): Promise<bigint> => {
    if (nonceOptions) {
      if (nonceOptions?.nonceOverride) return BigInt(nonceOptions.nonceOverride)
      if (nonceOptions?.validationMode)
        _validationMode = nonceOptions.validationMode
    }
    try {
      const key: string = concat([
        "0x000000",
        _validationMode,
        defaultedActiveModule.address
      ])
      const accountAddress = await getAddress()
      return await entryPointContract.read.getNonce([
        accountAddress,
        BigInt(key)
      ])
    } catch (e) {
      return BigInt(0)
    }
  }

  /**
   * Signs a message
   * @param {Object} params - The parameters for signing
   * @param {SignableMessage} params.message - The message to sign
   * @returns {Promise<Hex>} A promise that resolves to the signature
   */
  const signMessage = async ({
    message
  }: { message: SignableMessage }): Promise<Hex> => {
    const tempSignature = await defaultedActiveModule
      .getSigner()
      .signMessage(message)

    const signature = encodePacked(
      ["address", "bytes"],
      [defaultedActiveModule.getAddress(), tempSignature]
    )

    const erc6492Signature = concat([
      encodeAbiParameters(
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
        [factoryAddress, factoryData, signature]
      ),
      MAGIC_BYTES
    ])

    const accountIsDeployed = await isDeployed()
    return accountIsDeployed ? signature : erc6492Signature
  }

  return toSmartAccount({
    client: masterClient,
    entryPoint: {
      abi: EntrypointAbi,
      address: contracts.entryPoint.address,
      version: "0.7"
    },
    getAddress,
    encodeCalls: (calls: readonly Call[]): Promise<Hex> => {
      return calls.length === 1
        ? encodeExecute(calls[0])
        : encodeExecuteBatch(calls)
    },
    getFactoryArgs: async () => ({ factory: factoryAddress, factoryData }),
    getStubSignature: async (): Promise<Hex> => {
      return defaultedActiveModule.getDummySignature()
    },
    signMessage,
    signTypedData: <
      const typedData extends TypedData | Record<string, unknown>,
      primaryType extends keyof typedData | "EIP712Domain" = keyof typedData
    >(
      _: TypedDataDefinition<typedData, primaryType>
    ): Promise<Hex> => {
      throw new Error("signTypedData not supported")
    },
    signUserOperation: async (
      parameters: UnionPartialBy<UserOperation, "sender"> & {
        chainId?: number | undefined
      }
    ): Promise<Hex> => {
      const { chainId = masterClient.chain.id, ...userOpWithoutSender } =
        parameters
      const address = await getCounterFactualAddress()
      const userOperation = { ...userOpWithoutSender, sender: address }
      const hash = getUserOperationHash({
        chainId,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: "0.7",
        userOperation
      })
      return await defaultedActiveModule.signUserOpHash(hash)
    },
    getNonce,
    extend: {
      getCounterFactualAddress,
      isDeployed,
      getInitCode,
      encodeExecute,
      encodeExecuteBatch,
      getUserOpHash,
      factoryData,
      factoryAddress
    }
  })
}
