import { SignTypedDataParams, SmartAccountSigner } from "@alchemy/aa-core";
import { Hex } from "viem";
import { Signer, TypedDataField } from "ethers";

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

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    const signature = await this.inner?.signMessage(message);
    return this.#correctSignature(signature as Hex);
  }

  async signTypedData({ types, domain, message }: SignTypedDataParams): Promise<Hex> {
    if (!domain) {
      throw new Error("Could not sign typed data");
    }
    const newTypes = types as unknown as Record<string, TypedDataField[]>; // Casting cross-provider: viem -> ethers
    return (await this.inner.signTypedData(domain, newTypes, message)) as Hex;
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
