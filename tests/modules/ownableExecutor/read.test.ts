import {
    http,
    createWalletClient,
  } from "viem"
  import { privateKeyToAccount } from "viem/accounts"
  import { baseSepolia } from "viem/chains"
  import { describe, expect, test } from "vitest"
  import {
    createOwnableExecutorModule
  } from "../../../src"
  import { createSmartAccountClient } from "../../../src/account"
  import type { NexusSmartAccount } from "../../../src/account/NexusSmartAccount"
  import { getConfig } from "../../utils"
  
  describe("Account:Modules:OwnableExecutor", async () => {
    const { privateKey, bundlerUrl } = getConfig()
    const account = privateKeyToAccount(`0x${privateKey}`)
  
    const [walletClient] = [
      createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      })
    ]
  
    const smartAccount: NexusSmartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl
    })
  
    describe("Ownable Executor Module Tests", async () => {
        test("should initialize Ownable Executor Module with correct owners", async () => {
            const ownableExecutorModule = await createOwnableExecutorModule(smartAccount)
            const owners = await ownableExecutorModule.getOwners();
            expect(owners).toStrictEqual(ownableExecutorModule.owners);
        })
    })
  })
  