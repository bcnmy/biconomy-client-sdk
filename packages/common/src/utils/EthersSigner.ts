import { SmartAccountSigner } from "@alchemy/aa-core";
import { Hex, SignableMessage } from "viem";
import { Signer } from "@ethersproject/abstract-signer";

export class EthersSigner<T extends Signer> implements SmartAccountSigner<T> {
  signerType: string = "ethers";

  inner: T;

  constructor(inner: T, signerType: string) {
    this.inner = inner;
    this.signerType = signerType;
  }

  async getAddress() {
    return (await this.inner.getAddress()) as Hex;
  }

  async signMessage(_message: SignableMessage): Promise<Hex> {
    const message = typeof _message === "string" ? _message : _message.raw;
    const signature = await this.inner?.signMessage(message);
    return this.#correctSignature(signature as Hex);
  }

  async signTypedData(_notUsed: any): Promise<Hex> {
    throw new Error("signTypedData is not supported for Ethers Signer");
  }

  #correctSignature = (signature: Hex): Hex => {
    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27;
      signature = signature.slice(0, -2) + correctV.toString(16);
    }
    return signature;
  };
}

export default EthersSigner;
