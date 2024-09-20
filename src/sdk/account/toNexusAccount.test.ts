import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
  concat,
  concatHex,
  createWalletClient,
  domainSeparator,
  encodeAbiParameters,
  encodePacked,
  hashMessage,
  isAddress,
  isHex,
  keccak256,
  parseAbi,
  parseAbiParameters,
  parseEther,
  toBytes,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { TokenWithPermitAbi } from "../../test/__contracts/abi/TokenWithPermitAbi"
import { mockAddresses } from "../../test/__contracts/mockAddresses"
import { toNetwork } from "../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  getTestSmartAccountClient,
  killNetwork,
  toTestClient
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import { NexusAbi } from "../__contracts/abi/NexusAbi"
import { addresses } from "../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../clients/createNexusClient"
import { type NexusAccount, toNexusAccount } from "./toNexusAccount"
import { getAccountDomainStructFields } from "./utils"
import {
  NEXUS_DOMAIN_NAME,
  NEXUS_DOMAIN_TYPEHASH,
  NEXUS_DOMAIN_VERSION,
  PARENT_TYPEHASH,
  eip1271MagicValue
} from "./utils/Constants"
import type { UserOperationStruct } from "./utils/Types"

describe("nexus.account", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let account: Account
  let nexusAccountAddress: Address
  let nexusClient: NexusClient
  let nexusAccount: NexusAccount
  let walletClient: WalletClient

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    testClient = toTestClient(chain, getTestAccount(5))

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    nexusClient = await getTestSmartAccountClient({
      account,
      chain,
      bundlerUrl
    })

    nexusAccount = nexusClient.account
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should check isValidSignature PersonalSign is valid", async () => {
    const data = hashMessage("0x1234")

    // Calculate the domain separator
    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters("bytes32, bytes32, bytes32, uint256, address"),
        [
          keccak256(toBytes(NEXUS_DOMAIN_TYPEHASH)),
          keccak256(toBytes(NEXUS_DOMAIN_NAME)),
          keccak256(toBytes(NEXUS_DOMAIN_VERSION)),
          BigInt(chain.id),
          nexusAccountAddress
        ]
      )
    )

    // Calculate the parent struct hash
    const parentStructHash = keccak256(
      encodeAbiParameters(parseAbiParameters("bytes32, bytes32"), [
        keccak256(toBytes("PersonalSign(bytes prefixed)")),
        hashMessage(data)
      ])
    )

    // Calculate the final hash
    const resultHash: Hex = keccak256(
      concat(["0x1901", domainSeparator, parentStructHash])
    )

    const signature = await nexusAccount.signMessage({
      message: { raw: toBytes(resultHash) }
    })

    const contractResponse = await testClient.readContract({
      address: nexusAccountAddress,
      abi: NexusAbi,
      functionName: "isValidSignature",
      args: [hashMessage(data), signature]
    })

    const viemResponse = await testClient.verifyMessage({
      address: nexusAccountAddress,
      message: data,
      signature
    })

    expect(contractResponse).toBe(eip1271MagicValue)
    expect(viemResponse).toBe(true)
  })

  test("should have 4337 account actions", async () => {
    const [
      isDeployed,
      counterfactualAddress,
      userOpHash,
      address,
      factoryArgs,
      stubSignature,
      signedMessage,
      nonce,
      initCode,
      encodedExecute,
      encodedExecuteBatch
    ] = await Promise.all([
      nexusAccount.isDeployed(),
      nexusAccount.getCounterFactualAddress(),
      nexusAccount.getUserOpHash({
        sender: account.address,
        nonce: 0n,
        data: "0x",
        signature: "0x",
        verificationGasLimit: 1n,
        preVerificationGas: 1n,
        callData: "0x",
        callGasLimit: 1n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n
      } as UserOperationStruct),
      nexusAccount.getAddress(),
      nexusAccount.getFactoryArgs(),
      nexusAccount.getStubSignature(),
      nexusAccount.signMessage({ message: "hello" }),
      nexusAccount.getNonce(),
      nexusAccount.getInitCode(),
      nexusAccount.encodeExecute({ to: account.address, value: 100n }),
      nexusAccount.encodeExecuteBatch([{ to: account.address, value: 100n }])
    ])

    expect(isAddress(counterfactualAddress)).toBe(true)
    expect(isHex(userOpHash)).toBe(true)
    expect(isAddress(address)).toBe(true)
    expect(address).toBe(nexusAccountAddress)

    if (isDeployed) {
      expect(factoryArgs.factory).toBe(undefined)
      expect(factoryArgs.factoryData).toBe(undefined)
    } else {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      expect(isAddress(factoryArgs.factory!)).toBe(true)
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      expect(isHex(factoryArgs.factoryData!)).toBe(true)
    }

    expect(isHex(stubSignature)).toBe(true)
    expect(isHex(signedMessage)).toBe(true)
    expect(typeof nonce).toBe("bigint")
    expect(initCode.indexOf(nexusAccount.factoryAddress) > -1).toBe(true)
    expect(typeof isDeployed).toBe("boolean")

    expect(isHex(encodedExecute)).toBe(true)
    expect(isHex(encodedExecuteBatch)).toBe(true)
  })

  test("should test isValidSignature EIP712Sign to be valid with viem", async () => {
    const message = {
      contents: keccak256(toBytes("test", { size: 32 }))
    }

    const domainSeparator = await testClient.readContract({
      address: await nexusAccount.getAddress(),
      abi: parseAbi([
        "function DOMAIN_SEPARATOR() external view returns (bytes32)"
      ]),
      functionName: "DOMAIN_SEPARATOR"
    })

    const typedHashHashed = keccak256(
      concat(["0x1901", domainSeparator, message.contents])
    )

    const accountDomainStructFields = await getAccountDomainStructFields(
      testClient as unknown as PublicClient,
      nexusAccountAddress
    )

    const parentStructHash = keccak256(
      encodePacked(
        ["bytes", "bytes"],
        [
          encodeAbiParameters(parseAbiParameters(["bytes32, bytes32"]), [
            keccak256(toBytes(PARENT_TYPEHASH)),
            message.contents
          ]),
          accountDomainStructFields
        ]
      )
    )

    const dataToSign = keccak256(
      concat(["0x1901", domainSeparator, parentStructHash])
    )

    const signature = await walletClient.signMessage({
      account,
      message: { raw: toBytes(dataToSign) }
    })

    const contentsType = toBytes("Contents(bytes32 stuff)")

    const signatureData = concatHex([
      signature,
      domainSeparator,
      message.contents,
      toHex(contentsType),
      toHex(contentsType.length, { size: 2 })
    ])

    const finalSignature = encodePacked(
      ["address", "bytes"],
      [addresses.K1Validator, signatureData]
    )

    const contractResponse = await testClient.readContract({
      address: await nexusAccount.getAddress(),
      abi: NexusAbi,
      functionName: "isValidSignature",
      args: [typedHashHashed, finalSignature]
    })

    expect(contractResponse).toBe(eip1271MagicValue)
  })

  test("should sign using signTypedData SDK method", async () => {
    const appDomain = {
      chainId: chain.id,
      name: "TokenWithPermit",
      verifyingContract: mockAddresses.TokenWithPermit,
      version: "1"
    }

    const primaryType = "Contents"
    const types = {
      Contents: [
        {
          name: "stuff",
          type: "bytes32"
        }
      ]
    }

    const permitTypehash = keccak256(
      toBytes(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
      )
    )
    const nonce = (await testClient.readContract({
      address: mockAddresses.TokenWithPermit,
      abi: TokenWithPermitAbi,
      functionName: "nonces",
      args: [nexusAccountAddress]
    })) as bigint

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now

    const message = {
      stuff: keccak256(
        encodeAbiParameters(
          parseAbiParameters(
            "bytes32, address, address, uint256, uint256, uint256"
          ),
          [
            permitTypehash,
            nexusAccountAddress,
            nexusAccountAddress,
            parseEther("2"),
            nonce,
            deadline
          ]
        )
      )
    }

    const appDomainSeparator = domainSeparator({
      domain: appDomain
    })

    const contentsHash = keccak256(
      concat(["0x1901", appDomainSeparator, message.stuff])
    )

    const finalSignature = await nexusClient.signTypedData({
      domain: appDomain,
      primaryType,
      types,
      message
    })

    const nexusResponse = await testClient.readContract({
      address: nexusAccountAddress,
      abi: NexusAbi,
      functionName: "isValidSignature",
      args: [contentsHash, finalSignature]
    })

    const permitTokenResponse = await nexusClient.writeContract({
      address: mockAddresses.TokenWithPermit,
      abi: TokenWithPermitAbi,
      functionName: "permitWith1271",
      chain: network.chain,
      args: [
        nexusAccountAddress,
        nexusAccountAddress,
        parseEther("2"),
        deadline,
        finalSignature
      ]
    })

    await testClient.waitForTransactionReceipt({ hash: permitTokenResponse })

    const allowance = await testClient.readContract({
      address: mockAddresses.TokenWithPermit,
      abi: TokenWithPermitAbi,
      functionName: "allowance",
      args: [nexusAccountAddress, nexusAccountAddress]
    })

    expect(allowance).toEqual(parseEther("2"))
    expect(nexusResponse).toEqual("0x1626ba7e")
  })
})
