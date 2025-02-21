import type { Hex, SignableMessage } from "viem"
import type { LightSigner, SmartAccountSigner } from "../utils/Types.js"

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
    let signature = _signature
    const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27
      signature = signature.slice(0, -2) + correctV.toString(16)
    }
    return signature as Hex
  }
}

export default EthersSigner
