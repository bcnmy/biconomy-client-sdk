import { privateKeyToAccount } from "viem/accounts"
import { getConfig } from "../tests/utils"
import { createWalletClient, http, parseEther } from "viem"
import { createK1ValidatorModule, createSmartAccountClient, ModuleType } from "../src"


const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl
  } = getConfig()

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
    chainId,
    signer: walletClient,
    bundlerUrl,
    paymasterUrl
  })

const sendUserOperation = async () => {
    const k1ValidatorModule = await createK1ValidatorModule(smartAccount.getSigner())

    const isInstalled = await smartAccount.isModuleInstalled({moduleType: ModuleType.Validation, moduleAddress: k1ValidatorModule.moduleAddress});
    console.log("Is k1ValidatorModule installed: ", isInstalled);

    smartAccount.setActiveValidationModule(k1ValidatorModule);

    const transaction = {
        to: recipient, // NFT address
        data: "0x",
        value: parseEther("0.0001")
    }

    const response = await smartAccount.sendTransaction([transaction])
    console.log(response, "response")

    const receipt = await response.wait()
    console.log("Receipt: ", receipt)
}  

sendUserOperation();

