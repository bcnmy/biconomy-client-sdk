import type { Account, Chain, PublicClient, TypedData } from "viem"
import {
  type Address,
  type Client,
  type Hex,
  type TypedDataDefinition,
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  keccak256,
  parseAbi,
  parseAbiParameters,
  toHex
} from "viem"
import {
  getBytecode,
  getChainId,
  signMessage,
  signTypedData
} from "viem/actions"

import type { BaseValidationModule } from "../../modules/types/index.js"
import { createK1ValidatorModule } from "../../modules/validators/k1Validator.js"
import { getSenderAddress } from "../actions/getSenderAddress.js"
import { createAccountAbi, metaFactorytAbi } from "../utils/abis.js"
import SmartAccountAbi from "../utils/abis/smartAccount.json"
import {
  ENTRYPOINT_ADDRESS_V07,
  K1_VALIDATOR_ADDRESS
} from "../utils/constants.js"
import {
  CALLTYPE_BATCH,
  CALLTYPE_SINGLE,
  EXECTYPE_DEFAULT,
  MODE_DEFAULT,
  MODE_PAYLOAD,
  UNUSED
} from "../utils/constants.js"
import { getUserOperationHash, toSmartAccount } from "../utils/helpers.js"
import type {
  GetAccountAddressParams,
  GetFactoryDataParams,
  SignerToBiconomySmartAccountParameters,
  SmartAccount
} from "../utils/types.js"

/**
 * Default addresses for Biconomy Smart Account
 */
const BICONOMY_ADDRESSES: {
  ACCOUNT_V3_0_LOGIC: Address
  FACTORY_ADDRESS: Address
  K1_VALIDATOR_MODULE: Address
  BOOTSTRAP: Address
} = {
  ACCOUNT_V3_0_LOGIC: "0x26A1fe54198494Ba1a1aaD2D5E8255E91674C539", // UPDATED
  FACTORY_ADDRESS: "0x7769425B703A3c6AC8BbA33d0afd8eF94763DA2E", // UPDATED
  K1_VALIDATOR_MODULE: "0x7f0368d075179a7a807aA4eBd51241B7d2761A02", // UPDATE FOR V7
  BOOTSTRAP: "0x"
}

const getAccountInitCode = async ({
  factoryAddress,
  factoryData
}: {
  factoryAddress: Address
  factoryData: Hex
}): Promise<Hex> => {
  // if (!owner) throw new Error("Owner account not found")

  // const salt = keccak256(toHex(index));
  // const initData = await publicClient.readContract({
  //   address: bootstrapAddress,
  //   abi: parseAbi(['function getInitNexusCalldata(BootstrapConfig[] $validators, BootstrapConfig[] $executors, BootstrapConfig hook, BootstrapConfig[] $fallbacks) external view returns (bytes init)']),
  //   functionName: "getInitNexusCalldata",
  //   args: [validators, executors, hook, fallbacks]
  // })

  return encodeFunctionData({
    abi: metaFactorytAbi,
    functionName: "deployWithFactory",
    args: [factoryAddress, factoryData]
  })
}

const getFactoryData = async ({
  publicClient,
  owner,
  bootstrapAddress,
  index,
  modules
}: GetFactoryDataParams): Promise<Hex> => {
  if (!owner) throw new Error("Owner account not found")

  const salt = keccak256(toHex(index))
  const initData = await publicClient.readContract({
    address: bootstrapAddress,
    abi: parseAbi([
      "function getInitNexusCalldata(BootstrapConfig[] $validators, BootstrapConfig[] $executors, BootstrapConfig hook, BootstrapConfig[] $fallbacks) external view returns (bytes init)"
    ]),
    functionName: "getInitNexusCalldata",
    args: [
      modules?.validators ?? [K1_VALIDATOR_ADDRESS],
      modules?.executors ?? [],
      modules?.hook ?? [],
      modules?.fallbacks ?? []
    ]
  })

  return encodeFunctionData({
    abi: createAccountAbi,
    functionName: "createAccount",
    args: [initData, salt]
  })
}

const getK1ValidatorFactoryData = async ({
  owner,
  index
}: GetFactoryDataParams & {
  isK1ValidatorFactory: boolean | false
}): Promise<Hex> => {
  if (!owner) throw new Error("Owner account not found")

  return encodeFunctionData({
    abi: createAccountAbi,
    functionName: "createAccount",
    args: [owner, index]
  })
}

export const isSmartAccountDeployed = async (
  client: Client,
  address: Address
): Promise<boolean> => {
  const contractCode = await getBytecode(client, {
    address: address
  })

  if ((contractCode?.length ?? 0) > 2) {
    return true
  }
  return false
}

const getAccountAddress = async ({
  client,
  factoryAddress,
  initCode
}: GetAccountAddressParams): Promise<Address> => {
  // Get the sender address based on the init code
  return getSenderAddress(client, {
    factory: factoryAddress,
    factoryData: initCode,
    entryPoint: ENTRYPOINT_ADDRESS_V07
  })
}

export async function signerToNexus(
  client: PublicClient,
  {
    signer,
    index = 0n, // TODO: create test for index
    factoryAddress = BICONOMY_ADDRESSES.FACTORY_ADDRESS,
    modules
  }: SignerToBiconomySmartAccountParameters
): Promise<SmartAccount> {
  // Get the private key related account
  const viemSigner: Account = {
    ...signer,
    signTransaction: (_, __) => {
      throw new Error("Sign transaction not supported by smart account.")
    }
  } as Account

  let _activeValidationModule = await createK1ValidatorModule({
    moduleAddress:
      modules?.validators[0] ?? BICONOMY_ADDRESSES.K1_VALIDATOR_MODULE,
    signer: viemSigner
  })

  const factoryData = await getFactoryData({
    publicClient: client,
    owner: viemSigner.address,
    modules,
    bootstrapAddress: BICONOMY_ADDRESSES.BOOTSTRAP,
    index
  })

  // Helper to generate the init code for the smart account
  const generateInitCode = async () =>
    getAccountInitCode({
      factoryAddress,
      factoryData
    })

  // Fetch account address and chain id
  const [accountAddress, chainId] = await Promise.all([
    getAccountAddress({
      client,
      owner: viemSigner.address,
      initCode: await generateInitCode(),
      factoryAddress,
      index
    }),
    getChainId(client)
  ])

  if (!accountAddress) throw new Error("Account address not found")

  let smartAccountDeployed = await isSmartAccountDeployed(
    client,
    accountAddress
  )

  return toSmartAccount({
    address: accountAddress,
    activeValidationModule: _activeValidationModule,
    client: client,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    source: "biconomySmartAccountV3",
    async signMessage({ message }) {
      let signature: Hex = await signMessage(client, {
        account: viemSigner,
        message
      })
      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = (signature.slice(0, -2) + correctV.toString(16)) as Hex
      }
      return encodeAbiParameters(
        [{ type: "bytes" }, { type: "address" }],
        [signature, _activeValidationModule.getModuleAddress()]
      )
    },
    async signTransaction(_, __) {
      throw new Error("Sign transaction not supported by smart account.")
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      let signature: Hex = await signTypedData<
        TTypedData,
        TPrimaryType,
        Chain | undefined,
        undefined
      >(client, {
        account: viemSigner,
        ...typedData
      })
      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = (signature.slice(0, -2) + correctV.toString(16)) as Hex
      }
      return encodeAbiParameters(
        [{ type: "bytes" }, { type: "address" }],
        [signature, _activeValidationModule.getModuleAddress()]
      )
    },
    // Get the nonce of the smart account
    async getNonce() {
      // @ts-ignore
      return await client.readContract({
        address: ENTRYPOINT_ADDRESS_V07,
        abi: [
          {
            inputs: [
              {
                name: "sender",
                type: "address"
              },
              {
                name: "key",
                type: "uint192"
              }
            ],
            name: "getNonce",
            outputs: [
              {
                name: "nonce",
                type: "uint256"
              }
            ],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: "getNonce",
        args: [accountAddress, index ?? 0n] // TODO: check if index is correct here
      })
    },

    // Sign a user operation
    async signUserOperation(userOperation) {
      // validateUserOp(userOperation)
      const hash = getUserOperationHash({
        userOperation: {
          ...userOperation,
          signature: "0x"
        },
        chainId: chainId
      })
      const signature = await signMessage(client, {
        account: viemSigner,
        message: { raw: hash }
      })
      // userOp signature is encoded module signature + module address
      const signatureWithModuleAddress = encodeAbiParameters(
        parseAbiParameters("bytes, address"),
        [signature, _activeValidationModule.getModuleAddress()]
      )
      return signatureWithModuleAddress
    },

    async getFactory() {
      if (smartAccountDeployed) return undefined

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return undefined

      return factoryAddress
    },

    async getFactoryData() {
      if (smartAccountDeployed) return undefined

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return undefined
      return generateInitCode()
    },

    // Encode the init code
    async getInitCode() {
      if (smartAccountDeployed) return "0x"

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return "0x"

      return concatHex([factoryAddress, await generateInitCode()])
    },

    // Encode the deploy call data
    async encodeDeployCallData(_) {
      throw new Error("Doesn't support account deployment")
    },

    // Encode a call
    async encodeCallData(args) {
      if (Array.isArray(args)) {
        // Encode a batched call
        const argsArray = args as {
          to: Address
          value: bigint
          data: Hex
        }[]

        const mode = concatHex([
          CALLTYPE_BATCH,
          EXECTYPE_DEFAULT,
          MODE_DEFAULT,
          UNUSED,
          MODE_PAYLOAD
        ])

        const executionCalldata = encodePacked(
          [["address", "uint256", "bytes"]],
          [argsArray.map(({ to, value, data }) => [to, value, data])]
        )

        return encodeFunctionData({
          abi: SmartAccountAbi,
          functionName: "execute",
          args: [mode, executionCalldata]
        })
      }
      const { to, value, data } = args as {
        to: Address
        value: bigint
        data: Hex
      }

      const mode = concatHex([
        EXECTYPE_DEFAULT,
        CALLTYPE_SINGLE,
        UNUSED,
        MODE_DEFAULT,
        MODE_PAYLOAD
      ])

      const executionCalldata = encodePacked(
        ["address", "uint256", "bytes"],
        [to, value, data]
      )
      // Encode a simple call
      return encodeFunctionData({
        abi: SmartAccountAbi,
        functionName: "execute",
        args: [mode, executionCalldata]
      })
    },

    // Get simple dummy signature for k1 Validator module authorization
    async getDummySignature() {
      const moduleAddress = _activeValidationModule.getModuleAddress()
      const dynamicPart = moduleAddress.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
    },

    getAccountOwner(): Account {
      return viemSigner
    },

    getAccountAddress(): Address {
      return accountAddress
    },

    setActiveValidationModule(
      validationModule: BaseValidationModule
    ): BaseValidationModule {
      _activeValidationModule = validationModule
      return _activeValidationModule
    }
  })
}
