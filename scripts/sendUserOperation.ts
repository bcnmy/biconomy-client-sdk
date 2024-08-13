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
  })

const sendUserOperation = async () => {
    const k1ValidatorModule = await createK1ValidatorModule(smartAccount.getSigner())

    smartAccount.setActiveValidationModule(k1ValidatorModule);

    const transaction = {
        to: recipient, // NFT address
        data: "0x",
        value: parseEther("0.0001")
    }
    console.log("Your smart account will be deployed at address, make sure it has some funds to pay for user ops: ", await smartAccount.getAddress());
    
    const response = await smartAccount.sendTransaction([transaction])

    const receipt = await response.wait()
    console.log("Receipt: ", receipt)
}  

sendUserOperation();

