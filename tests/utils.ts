import {
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  createPublicClient,
  createWalletClient,
  parseAbi,
  parseAbiParameters,
  keccak256,
  toBytes,
  encodePacked,
  encodeAbiParameters,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import type { EIP712DomainReturn } from "../src"
import { Logger } from "../src/account/utils/Logger"
import { getChain } from "../src/account/utils/getChain"
import { ethers } from "ethers"

export const getEnvVars = () => {
  const fields = [
    "BUNDLER_URL",
    "E2E_PRIVATE_KEY_ONE",
    "E2E_PRIVATE_KEY_TWO",
    "E2E_BICO_PAYMASTER_KEY_AMOY",
    "E2E_BICO_PAYMASTER_KEY_BASE",
    "CHAIN_ID"
  ]

  const errorFields = fields.filter((field) => !process?.env?.[field])
  if (errorFields.length) {
    throw new Error(
      `Missing environment variable${errorFields.length > 1 ? "s" : ""
      }: ${errorFields.join(", ")}`
    )
  }
  return {
    bundlerUrl: process.env.BUNDLER_URL || "",
    bundlerUrlTwo: getBundlerUrl(84532) || "",
    privateKey: process.env.E2E_PRIVATE_KEY_ONE || "",
    privateKeyTwo: process.env.E2E_PRIVATE_KEY_TWO || "",
    paymasterUrl: `https://paymaster.biconomy.io/api/v1/11155111/${process.env.E2E_BICO_PAYMASTER_KEY_AMOY || ""
      }`,
    paymasterUrlTwo: `https://paymaster.biconomy.io/api/v1/84532/${process.env.E2E_BICO_PAYMASTER_KEY_BASE || ""
      }`,
    chainId: process.env.CHAIN_ID || "0"
  }
}

export type TestConfig = {
  chain: Chain
  chainId: number
  paymasterUrl: string
  paymasterUrlTwo: string
  bundlerUrl: string
  privateKey: string
  privateKeyTwo: string
}
export const getConfig = (): TestConfig => {
  const {
    paymasterUrl,
    paymasterUrlTwo,
    bundlerUrl,
    chainId: chainIdFromEnv,
    privateKey,
    privateKeyTwo
  } = getEnvVars()
  const chains = [Number.parseInt(chainIdFromEnv)]
  const chainId = chains[0]
  const chain = getChain(chainId)

  // try {
  //   const chainIdFromBundlerUrl = extractChainIdFromBundlerUrl(bundlerUrl)
  //   chains.push(chainIdFromBundlerUrl)
  // } catch (e) {}

  // try {
  //   const chainIdFromPaymasterUrl = extractChainIdFromPaymasterUrl(paymasterUrl)
  //   chains.push(chainIdFromPaymasterUrl)
  // } catch (e) {}

  // COMMNETED in order to use pimlico bundler url
  // const allChainsMatch = chains.every((chain) => chain === chains[0])

  // if (!allChainsMatch) {
  //   throw new Error("Chain IDs do not match")
  // }

  return {
    chain,
    chainId,
    paymasterUrl,
    paymasterUrlTwo,
    bundlerUrl,
    privateKey,
    privateKeyTwo
  }
}

export const checkBalance = (
  owner: Hex,
  tokenAddress?: Hex,
  _chain?: Chain
) => {
  // const { chain: chainFromConfig } = getConfig()
  // const chain = _chain || chainFromConfig
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  })

  if (!tokenAddress) {
    return publicClient.getBalance({ address: owner })
  }
  return publicClient.readContract({
    address: tokenAddress,
    abi: parseAbi([
      "function balanceOf(address owner) public view returns (uint256 balance)"
    ]),
    functionName: "balanceOf",
    args: [owner]
  })
}

export const nonZeroBalance = async (address: Hex, tokenAddress?: Hex) => {
  const balance = await checkBalance(address, tokenAddress)
  if (balance > BigInt(0)) return
  throw new Error(
    `Insufficient balance ${tokenAddress ? `of token ${tokenAddress}` : "of native token"
    } during test setup of owner: ${address}`
  )
}

export const topUp = async (
  recipient: Hex,
  amount = BigInt(1000000),
  token?: Hex
) => {
  const { chain, privateKey } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const sender = account.address

  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const balanceOfSender = await checkBalance(sender, token)
  const balanceOfRecipient = await checkBalance(recipient, token)

  if (balanceOfRecipient > amount) {
    Logger.log(
      `balanceOfRecipient (${recipient}) already has enough ${token ?? "native token"
      } (${balanceOfRecipient}) during topUp`
    )
    return await Promise.resolve()
  }

  if (balanceOfSender < amount) {
    throw new Error(
      `Insufficient ${token ? token : ""
      }balance during test setup: ${balanceOfSender}`
    )
  }

  Logger.log(`topping up (${recipient}): (${balanceOfRecipient}).`)

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })

  if (token) {
    const hash = await walletClient.writeContract({
      address: token,
      abi: parseAbi([
        "function transfer(address recipient, uint256 amount) external"
      ]),
      functionName: "transfer",
      args: [recipient, amount]
    })
    await publicClient.waitForTransactionReceipt({ hash })
  } else {
    const hash = await walletClient.sendTransaction({
      to: recipient,
      value: amount
    })
    // await publicClient.waitForTransactionReceipt({ hash })
  }
}

// Returns the encoded EIP-712 domain struct fields.
export const getAccountDomainStructFields = async (
  publicClient: PublicClient,
  accountAddress: Address
) => {
  const accountDomainStructFields = (await publicClient.readContract({
    address: accountAddress,
    abi: parseAbi([
      "function eip712Domain() public view returns (bytes1 fields, string memory name, string memory version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] memory extensions)"
    ]),
    functionName: "eip712Domain"
  })) as EIP712DomainReturn

  const [fields, name, version, chainId, verifyingContract, salt, extensions] =
    accountDomainStructFields

  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes1", "bytes32", "bytes32", "uint256", "address", "bytes32", "bytes32"],
    [
      fields,
      ethers.keccak256(ethers.toUtf8Bytes(name)),
      ethers.keccak256(ethers.toUtf8Bytes(version)),
      chainId,
      verifyingContract,
      salt,
      ethers.keccak256(ethers.solidityPacked(["uint256[]"], [extensions]))
    ]
  )
}

export const getAccountDomainStructFieldsViem = async (
  publicClient: PublicClient,
  accountAddress: Address
) => {
  const accountDomainStructFields = (await publicClient.readContract({
    address: accountAddress,
    abi: parseAbi([
      "function eip712Domain() public view returns (bytes1 fields, string memory name, string memory version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] memory extensions)"
    ]),
    functionName: "eip712Domain"
  })) as EIP712DomainReturn

  const [fields, name, version, chainId, verifyingContract, salt, extensions] =
    accountDomainStructFields

  const params = parseAbiParameters(["bytes1, bytes32, bytes32, uint256, address, bytes32, bytes32"]);

  return encodeAbiParameters(
    params,
    [
      fields,
      keccak256(toBytes(name)),
      keccak256(toBytes(version)),
      chainId,
      verifyingContract,
      salt,
      keccak256(encodePacked(["uint256[]"], [extensions]))
    ]
  )
}

export const getBundlerUrl = (chainId: number) =>
  `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`
