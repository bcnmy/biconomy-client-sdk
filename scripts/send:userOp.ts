import { http, createWalletClient, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { createSmartAccountClient, getChain } from "../src"

const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

export const getEnvVars = () => {
  return {
    bundlerUrl: process.env.BUNDLER_URL || "",
    privateKey: process.env.E2E_PRIVATE_KEY_ONE || "",
    privateKeyTwo: process.env.E2E_PRIVATE_KEY_TWO || "",
    paymasterUrl: process.env.PAYMASTER_URL || "",
    chainId: process.env.CHAIN_ID || "0"
  }
}

export const getConfig = () => {
  const {
    paymasterUrl,
    bundlerUrl,
    chainId: chainIdFromEnv,
    privateKey,
    privateKeyTwo
  } = getEnvVars()

  const chains = [Number.parseInt(chainIdFromEnv)]
  const chainId = chains[0]
  const chain = getChain(chainId)

  return {
    chain,
    chainId,
    paymasterUrl,
    bundlerUrl,
    privateKey,
    privateKeyTwo
  }
}

const { chain, privateKey, privateKeyTwo, bundlerUrl, paymasterUrl } =
  getConfig()

if ([chain, privateKey, privateKeyTwo, bundlerUrl].every(Boolean) !== true)
  throw new Error("Missing env vars")

if (!paymasterUrl) {
  console.log("Running test without a paymaster")
}

const account = privateKeyToAccount(`0x${privateKey}`)
const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)
const recipient = accountTwo.address

const [walletClient] = [
  createWalletClient({
    account,
    chain,
    transport: http()
  })
]

const smartAccount = await createSmartAccountClient({
  chain,
  signer: walletClient,
  bundlerUrl,
  k1ValidatorAddress,
  factoryAddress,
  ...(paymasterUrl && { paymasterUrl })
})

const sendUserOperation = async () => {
  const transaction = {
    to: recipient, // NFT address
    data: "0x",
    value: parseEther("0.0001")
  }
  console.log(
    "Your smart account will be deployed at address, make sure it has some funds to pay for user ops: ",
    await smartAccount.getAddress()
  )

  const response = await smartAccount.sendTransaction([transaction])

  const receipt = await response.wait()
  console.log("Receipt: ", receipt)
}

sendUserOperation()
