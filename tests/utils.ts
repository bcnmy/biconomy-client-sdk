import {
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  parseAbi,
  parseAbiParameters,
  publicActions,
  walletActions
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { EIP712DomainReturn } from "../src"
import { Logger } from "../src/account/utils/Logger"
import { pKey } from "./testSetup"

export const checkBalance = (owner: Hex, chain: Chain, tokenAddress?: Hex) => {
  const account = privateKeyToAccount(pKey)

  // const { chain: chainFromConfig } = getConfig()
  const publicClient = createTestClient({
    mode: "anvil",
    chain,
    transport: http(),
    account
  })
    .extend(publicActions)
    .extend(walletActions)

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

export const nonZeroBalance = async (
  address: Hex,
  chain: Chain,
  tokenAddress?: Hex
) => {
  const balance = await checkBalance(address, chain, tokenAddress)
  if (balance > BigInt(0)) return
  throw new Error(
    `Insufficient balance ${
      tokenAddress ? `of token ${tokenAddress}` : "of native token"
    } during test setup of owner: ${address}`
  )
}

export const topUp = async (
  recipient: Hex,
  chain: Chain,
  amount = 100000000000000000000n,
  token?: Hex
) => {
  const account = privateKeyToAccount(pKey)
  const sender = account.address

  const publicClient = createTestClient({
    mode: "anvil",
    chain,
    transport: http(),
    account
  })
    .extend(publicActions)
    .extend(walletActions)

  const balanceOfSender = await checkBalance(sender, chain, token)
  const balanceOfRecipient = await checkBalance(recipient, chain, token)

  if (balanceOfRecipient > amount) {
    Logger.log(
      `balanceOfRecipient (${recipient}) already has enough ${
        token ?? "native token"
      } (${balanceOfRecipient}) during topUp`
    )
    return await Promise.resolve()
  }

  if (balanceOfSender < amount) {
    throw new Error(
      `Insufficient ${
        token ? token : ""
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
    const hash = await publicClient.writeContract({
      address: token,
      abi: parseAbi([
        "function transfer(address recipient, uint256 amount) external"
      ]),
      functionName: "transfer",
      args: [recipient, amount]
    })
    await publicClient.waitForTransactionReceipt({ hash })
  } else {
    const hash = await publicClient.sendTransaction({
      to: recipient,
      value: amount,
      chain
    })
    const result = await publicClient.waitForTransactionReceipt({ hash })
    console.log({ hash })
    return result
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

  const params = parseAbiParameters(
    "bytes1, string, string, uint256, address, bytes32, uint256[]"
  )

  return encodeAbiParameters(params, [
    fields,
    name,
    version,
    chainId,
    verifyingContract,
    salt,
    extensions
  ])
}

export const getBundlerUrl = (chainId: number) =>
  `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`
