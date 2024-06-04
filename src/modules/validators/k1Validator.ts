import { encodeFunctionData, encodePacked, publicActions, type Hex } from "viem"
import type { Prettify } from "viem/chains"
import { BaseValidationModule, K1ValidatorModuleConfig } from "../types"
import { ENTRYPOINT_ADDRESS_V07, K1_VALIDATOR_ADDRESS } from "../../accounts/utils/constants"
import { SmartAccountSigner, UserOperationStruct } from "../../accounts/utils/types"
import { createAccountAbi } from "../../accounts/utils/abis"

/**
 * Creates an K1 Validator Module Instance.
 * @param moduleConfig - The configuration for the module.
 * @returns A promise that resolves to a BaseValidationModule.
 */
export const createK1ValidatorModule = async (
  moduleConfig: K1ValidatorModuleConfig
): Promise<Prettify<BaseValidationModule>> => {
  let moduleAddress!: Hex

  if (moduleConfig.moduleAddress) {
    moduleAddress = moduleConfig.moduleAddress
  } else if (moduleConfig.version) {
    const moduleAddr = K1_VALIDATOR_ADDRESS;
    if (!moduleAddr) {
      throw new Error(`Invalid version ${moduleConfig.version}`)
    }
    moduleAddress = moduleAddr
  } else {
    moduleAddress = K1_VALIDATOR_ADDRESS
    // Note: in this case Version remains the default one
  }

  return {
    entryPointAddress: moduleConfig.entryPointAddress ?? ENTRYPOINT_ADDRESS_V07,
    /**
     * Returns the address of the module.
     * @returns {Hex} The address of the module.
     */
    getModuleAddress(): Hex {
      return moduleAddress
    },
    /**
     * Returns the signer of the smart account.
     * @returns {Promise<SmartAccountSigner>} A promise that resolves to the signer of the smart account.
     */
    async getSigner(): Promise<SmartAccountSigner> {
      return Promise.resolve(moduleConfig.signer)
    },

    /**
     * Returns a dummy signature.
     * @returns {Promise<Hex>} A promise that resolves to a dummy signature.
     */
    async getDummySignature(): Promise<Hex> {
      const dynamicPart = moduleAddress.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
    },

    /**
     * Returns the initialization data for the k1 Validator ownership module.
     * @returns {Promise<Hex>} A promise that resolves to the initialization data for the k1 Validator ownership module.
     */
    async getModuleInstallData(): Promise<Hex> {
      return encodePacked(["address", "uint256"], [moduleConfig.signer.address, moduleConfig.index ?? 0n])
    },

     /**
     * Installs k1ValidatorModule
     * @returns {Promise<Hex>} A promise that resolves to the transaction hash.
     */
    async installModule(): Promise<Hex> {
      const functionData = encodeFunctionData({
        abi: createAccountAbi,
        functionName: "createAccount",
        args: [moduleConfig.signer.address, moduleConfig.index ?? 0n]
      })

      return functionData; // TODO 
    },

    async uninstallModule(): Promise<Hex> {
        const functionData = encodeFunctionData({
          abi: createAccountAbi,
          functionName: "createAccount",
          args: [moduleConfig.signer.address, moduleConfig.index ?? 0n]
        })
  
        return functionData; // TODO 
    },

    /**
     * Signs the user operation hash.
     * @param {string} userOpHash - The user operation hash to sign.
     * @returns {Promise<Hex>} A promise that resolves to the signature of the user operation hash.
     */
    async signUserOpHash(userOpHash: string): Promise<Hex> {
      const sig = await moduleConfig.signer.signMessage({ message: userOpHash })
      return sig
    },

    /**
     * Signs a message.
     * @param {Uint8Array | string} _message - The message to sign.
     * @returns {Promise<string>} A promise that resolves to the signature of the message.
     */
    async signMessage(_message: Uint8Array | string): Promise<Hex> {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      let signature = await moduleConfig.signer.signMessage({ message })

      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = signature.slice(0, -2) + correctV.toString(16)
      }
      return signature as Hex
    },

    async validateUserOp(userOp: Partial<UserOperationStruct>, userOpHash: Hex): Promise<number> {
        return 1
    },

    async isValidSignatureWithSender(sender: Hex, hash: Hex, data: Hex): Promise<Hex> {
        return "0x"
    }

    // async signMessageSmartAccountSigner(
    //   _message: string | Uint8Array,
    //   signer: SmartAccountSigner
    // ): Promise<string> {
    //   const message =
    //     typeof _message === "string" ? _message : { raw: _message }
    //   let signature: `0x${string}` = await signer.signMessage({ message })

    //   const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
    //   if (![27, 28].includes(potentiallyIncorrectV)) {
    //     const correctV = potentiallyIncorrectV + 27
    //     signature = `0x${signature.slice(0, -2) + correctV.toString(16)}`
    //   }

    //   return signature
    // }
  }
}
