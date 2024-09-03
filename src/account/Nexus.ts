import {
  type AbiParameter,
  type Account,
  type Address,
  type Chain,
  type ClientConfig,
  type Hex,
  type Prettify,
  type SignableMessage,
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
  type UserOperation,
  getUserOperationHash,
  toSmartAccount
} from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import contracts from "../__contracts"
import { EntrypointAbi, K1ValidatorFactoryAbi } from "../__contracts/abi"
import { EXECUTE_BATCH, EXECUTE_SINGLE } from "../bundler/utils/Constants"
import {
  type GetNonceArgs,
  MAGIC_BYTES,
  MODE_VALIDATION,
  type ModeType,
  type NonceOptions,
  type UserOperationStruct,
  WalletClientSigner
} from "../index"
import type { BaseValidationModule } from "../modules/base/BaseValidationModule"
import { K1ValidatorModule } from "../modules/validators/K1ValidatorModule"
import { packUserOp } from "./utils/Utils"

export type ToNexusSmartAccountParameters = {
  chain: Chain
  transport: ClientConfig["transport"]
  owner: Account | Address
  index?: bigint | undefined
  activeModule?: BaseValidationModule
  factoryAddress?: Address
  k1ValidatorAddress?: Address
}

type Call = {
  to: Hex
  data?: Hex | undefined
  value?: bigint | undefined
}

export type Nexus = Prettify<Awaited<ReturnType<typeof toNexus>>>
export const toNexus = ({
  chain,
  transport,
  owner,
  index = 0n,
  activeModule,
  factoryAddress = contracts.k1ValidatorFactory.address,
  k1ValidatorAddress = contracts.k1Validator.address
}: ToNexusSmartAccountParameters) => {
  const masterClient = createWalletClient({
    account: parseAccount(owner),
    chain,
    transport
  })
    .extend(walletActions)
    .extend(publicActions)

  const signer = new WalletClientSigner(masterClient, "viem")

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
        moduleAddress: k1ValidatorAddress,
        type: "validator",
        data: signerAddress,
        additionalContext: "0x"
      },
      signer
    )

  let _accountAddress: Address
  const getAddress = async () => {
    if (_accountAddress) return _accountAddress
    const fetchedAddress = await masterClient.readContract({
      address: factoryAddress,
      abi: K1ValidatorFactoryAbi,
      functionName: "computeAccountAddress",
      args: [signerAddress, index, [], 0]
    })
    _accountAddress = fetchedAddress as Address
    return _accountAddress
  }
  const getCounterFactualAddress = async (): Promise<Address> => {
    try {
      // @ts-ignore
      await entryPointContract.simulate.getSenderAddress([getInitCode()])
    } catch (e) {
      if (e.cause?.data?.errorName === "SenderAddressResult") {
        _accountAddress = e.cause.data.args[0] as Address
        return _accountAddress
      }
    }
    throw new Error("Failed to get counterfactual account address")
  }

  const getInitCode = () => concatHex([factoryAddress, factoryData])

  const isDeployed = async (): Promise<boolean> => {
    const address = await getCounterFactualAddress()
    const contractCode = await masterClient.getCode({ address })
    return (contractCode?.length ?? 0) > 2
  }

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

  const encodeExecuteBatch = async (calls: readonly Call[]): Promise<Hex> => {
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
      args: [EXECUTE_BATCH, executionCalldataPrep]
    })
  }

  const encodeExecute = async (call: Call): Promise<Hex> => {
    const mode = EXECUTE_SINGLE
    const executionCalldata = encodePacked(
      ["address", "uint256", "bytes"],
      [
        call.to as Hex,
        BigInt(call.value ?? 0n),
        (call.data as Hex) ?? ("0x" as Hex)
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

  const getNonce = async ({
    key: _key,
    validationMode: _validationMode = MODE_VALIDATION,
    nonceOptions
  }: GetNonceArgs = {}): Promise<bigint> => {
    if (nonceOptions) {
      if (nonceOptions?.nonceOverride) return BigInt(nonceOptions.nonceOverride)
      if (nonceOptions?.validationMode)
        _validationMode = nonceOptions.validationMode
      if (nonceOptions?.nonceKey) _key = nonceOptions.nonceKey
    }
    try {
      const key =
        _key ??
        concat([
          "0x000000",
          _validationMode,
          defaultedActiveModule.moduleAddress
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
    signMessage: async ({
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
    },
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

      const nonce = await getNonce()

      console.log("nexnus nonce", { nonce })
      const address = await getCounterFactualAddress()
      const userOperation = { ...userOpWithoutSender, sender: address, nonce }

      const hash = getUserOperationHash({
        chainId,
        entryPointAddress: contracts.entryPoint.address,
        entryPointVersion: "0.7",
        userOperation
      })

      const signature = await defaultedActiveModule.signUserOpHash(hash)
      return signature
    },
    getNonce: async (parameters?: {
      key?: bigint | undefined
    }): Promise<bigint> => {
      return getNonce()
    },
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
