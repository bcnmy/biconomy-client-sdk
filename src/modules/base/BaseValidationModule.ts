import { type Hex, getAddress } from "viem"
import type { SmartAccountSigner } from "../../account/index.js"
import { BaseModule } from "../base/BaseModule.js"

export abstract class BaseValidationModule extends BaseModule {
  public getSigner(): SmartAccountSigner {
    return this.signer
  }

  async getDummySignature(): Promise<Hex> {
    const moduleAddress = getAddress(this.getAddress())
    const dynamicPart = moduleAddress.substring(2).padEnd(40, "0")
    return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
  }

  // TODO: To be implemented
  async getInitData(): Promise<Hex> {
    return "0x"
  }

  async signUserOpHash(userOpHash: string): Promise<Hex> {
    const sig = await this.signer.signMessage({ raw: userOpHash as Hex })
    return sig
  }

  async signMessageSmartAccountSigner(
    _message: string | Uint8Array,
    signer: SmartAccountSigner
  ): Promise<string> {
    const message = typeof _message === "string" ? _message : { raw: _message }
    let signature: `0x${string}` = await signer.signMessage(message)

    const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27
      signature = `0x${signature.slice(0, -2) + correctV.toString(16)}`
    }

    return signature
  }

  /**
   * Signs a message using the appropriate method based on the type of signer.
   *
   * @param {Uint8Array | string} message - The message to be signed.
   * @returns {Promise<string>} A promise resolving to the signature or error message.
   * @throws {Error} If the signer type is invalid or unsupported.
   */
  async signMessage(_message: Uint8Array | string): Promise<Hex> {
    const message = typeof _message === "string" ? _message : { raw: _message }
    let signature = await this.signer.signMessage(message)

    const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27
      signature = signature.slice(0, -2) + correctV.toString(16)
    }
    if (signature.slice(0, 2) !== "0x") {
      signature = `0x${signature}`
    }
    return signature as Hex
  }
}
