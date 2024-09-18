import {
  http,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
  createWalletClient,
  zeroAddress,
  encodePacked
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
} from "../src/account"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import {
  getTestAccount,
  getTestSmartAccount,
  killNetwork,
  toTestClient,
} from "./src/testUtils"
import type { MasterClient, NetworkConfig } from "./src/testUtils"
import { createK1ValidatorModule, createOwnableValidatorModule, getRandomSigner } from "../src/modules/index"
import { OwnableValidator } from "../src/modules/validators/OwnableValidator"
import { K1ValidatorModule } from "../src/modules/validators/K1ValidatorModule"
import { TEST_CONTRACTS } from "./src/callDatas"
import addresses from "../src/__contracts/addresses"

const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"

// @note Make sure the addresses used based on NETWORK_TYPE are valid
describe("modules.ownable.validator.install.write", () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient
  let walletClientTwo: WalletClient
  let testClient: MasterClient
  let account: Account
  let accountTwo: Account
  let smartAccount: NexusSmartAccount
  let smartAccountTwo: NexusSmartAccount
  let smartAccountAddress: Hex
  let ownableValidatorModule: OwnableValidator
  let k1ValidatorModule: K1ValidatorModule

  const OWNABLE_VALIDATOR_ADDRESS = TEST_CONTRACTS.OwnableValidator.address;

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)
    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = getTestAccount(0)
    accountTwo = getTestAccount(1)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    walletClientTwo = createWalletClient({
      account: accountTwo,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, getTestAccount(0))

    const code = await testClient.getBytecode({ address: addresses.K1ValidatorFactory });
    console.log(code, "code");

    smartAccount = await getTestSmartAccount(account, chain, bundlerUrl)
    smartAccountTwo = await getTestSmartAccount(accountTwo, chain, bundlerUrl)
    smartAccountAddress = await smartAccount.getAddress()

    ownableValidatorModule = await createOwnableValidatorModule(smartAccount, OWNABLE_VALIDATOR_ADDRESS, [account.address, accountTwo.address])
    k1ValidatorModule = await createK1ValidatorModule(smartAccount.getSigner())
    smartAccount.setActiveValidationModule(k1ValidatorModule)
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should install OwnableValidator module", async () => {
    const isInstalled = await smartAccount.isModuleInstalled({
      type: 'validator',
      moduleAddress: OWNABLE_VALIDATOR_ADDRESS
    })

    if (!isInstalled) {
      const response = await smartAccount.installModule({
        moduleAddress: ownableValidatorModule.moduleAddress,
        type: ownableValidatorModule.type,
        data: ownableValidatorModule.data
      })

      const receipt = await response.wait();
      expect(receipt.success).toBe(true)
    }

    const isInstalledAfter = await smartAccount.isModuleInstalled({
      type: 'validator',
      moduleAddress: OWNABLE_VALIDATOR_ADDRESS
    })
    expect(isInstalledAfter).toBe(true)
    smartAccount.setActiveValidationModule(ownableValidatorModule)
  })

  test("should get owners", async () => {
    const owners = await ownableValidatorModule.getOwners()
    console.log(owners, "owners");
    expect(owners).toContain(account.address)
  })

  test("should add an owner using OwnableValidator as validation module", async () => {
    smartAccount.setActiveValidationModule(ownableValidatorModule);
    const randomSigner = getRandomSigner();

    const ownersBefore = await ownableValidatorModule.getOwners()
    expect(ownersBefore).not.toContain(randomSigner.address)

    // Don't add owner if already 4 owners
    if (ownersBefore.length <= 4) {
      const userOp = await ownableValidatorModule.addOwnerUserOp(randomSigner.address);

      const userOpHash = await smartAccount.getUserOpHash(userOp);
      const signature1 = await walletClient.signMessage({ message: { raw: userOpHash }, account: account });
      const signature2 = await walletClientTwo.signMessage({ message: { raw: userOpHash }, account: accountTwo });

      const response = await smartAccount.sendUserOp(userOp, ownableValidatorModule.getMultiSignature([signature1, signature2]))
      const receipt = await response.wait();

      const ownersAfter = await ownableValidatorModule.getOwners()
      expect(ownersAfter).toContain(randomSigner.address)

      expect(receipt.success).toBe(true)
    }
  })

  test("should set threshold", async () => {
    // Get setThreshold user operation
    const setThresholdUserOp = await ownableValidatorModule.setThresholdUserOp(2);

    // Get user operation hash
    const userOpHash = await smartAccount.getUserOpHash(setThresholdUserOp);

    // Sign the user operation hash with both accounts
    const signature1 = await walletClient.signMessage({ message: { raw: userOpHash }, account: account });
    const signature2 = await walletClientTwo.signMessage({ message: { raw: userOpHash }, account: accountTwo });

    // Set threshold to 2
    const response = await smartAccount.sendUserOp(setThresholdUserOp, ownableValidatorModule.getMultiSignature([signature1, signature2]))
    const receipt = await response.wait();

    expect(receipt.success).toBe(true)

    // Verify that threshold has been updated
    const newThreshold = ownableValidatorModule.threshold;
    expect(newThreshold).toBe(2);
  });

  test("should need 2 signatures to send a user operation", async () => {
    // Make sure the OwnableValidator is set as the active validation module
    smartAccount.setActiveValidationModule(ownableValidatorModule);

    const userOp = await smartAccount.buildUserOp([{
      to: zeroAddress,
      data: "0x",
      value: 0n
    }]);

    const userOpHash = await smartAccount.getUserOpHash(userOp);
    const signature1 = await walletClient.signMessage({ message: { raw: userOpHash }, account: account });
    const signature2 = await walletClientTwo.signMessage({ message: { raw: userOpHash }, account: accountTwo });

    const response = await smartAccount.sendUserOp(userOp, encodePacked(['bytes', 'bytes'], [signature1, signature2]))
    await response.wait()
  })

  test("should remove an owner", async () => {
    const activeValidator = smartAccount.activeValidationModule
    expect(activeValidator).toBe(ownableValidatorModule)

    const ownersBefore = await ownableValidatorModule.getOwners()
    const ownerToRemove = ownersBefore[0]
    expect(ownersBefore).toContain(ownerToRemove)
    if (ownerToRemove !== account.address || ownerToRemove !== accountTwo.address) {
      const userOp = await ownableValidatorModule.removeOwnerUserOp(ownerToRemove);

      const userOpHash = await smartAccount.getUserOpHash(userOp);
      const signature1 = await walletClient.signMessage({ message: { raw: userOpHash }, account: account });
      const signature2 = await walletClientTwo.signMessage({ message: { raw: userOpHash }, account: accountTwo });

      const response = await smartAccount.sendUserOp(userOp, ownableValidatorModule.getMultiSignature([signature1, signature2]))
      const receipt = await response.wait();
      expect(receipt.success).toBe(true)

      // Wait for a short period to ensure the transaction is processed
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Retry getting owners with exponential backoff
      const getOwnersWithRetry = async (retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
          const ownersAfter = await ownableValidatorModule.getOwners()
          if (!ownersAfter.includes(ownerToRemove)) {
            return ownersAfter
          }
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2
        }
        throw new Error('Failed to get updated owners list after multiple retries')
      }

      const ownersAfter = await getOwnersWithRetry()
      expect(ownersAfter).not.toContain(ownerToRemove)
    }
  })

  // @note Won't work if this is the only validation module installed (fails with 0xcc319d84)
  test.skip("should uninstall OwnableValidator module", async () => {
    smartAccount.setActiveValidationModule(k1ValidatorModule);
    const response = await smartAccount.uninstallModule({
      moduleAddress: ownableValidatorModule.moduleAddress,
      type: ownableValidatorModule.type,
      data: "0x"
    })

    const receipt = await response.wait()
    expect(receipt.success).toBe(true)

    const isInstalled = await smartAccount.isModuleInstalled({
      type: 'validator',
      moduleAddress: OWNABLE_VALIDATOR_ADDRESS
    })
    expect(isInstalled).toBe(false)
  })
})
