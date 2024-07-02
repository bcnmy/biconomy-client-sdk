import type { Hex, SignableMessage } from "viem"
import type { LightSigner, SmartAccountSigner } from "../utils/Types.js"
import { fixPotentiallyIncorrectVForSignature } from "./Utils.js"

export class EthersSigner<T extends LightSigner>
  implements SmartAccountSigner<T>
{
  signerType = "ethers"

  inner: T

  constructor(inner: T, signerType: string) {
    this.inner = inner
    this.signerType = signerType
  }

  async getAddress() {
    return (await this.inner.getAddress()) as Hex
  }

  async signMessage(_message: SignableMessage): Promise<Hex> {
    const message = typeof _message === "string" ? _message : _message.raw
    const signature = await this.inner?.signMessage(message)
    return this.#correctSignature(signature as Hex)
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  async signTypedData(_: any): Promise<Hex> {
    throw new Error("signTypedData is not supported for Ethers Signer")
  }

  #correctSignature = (_signature: Hex): Hex => {
    return fixPotentiallyIncorrectVForSignature(_signature)
  }
}

export default EthersSigner
