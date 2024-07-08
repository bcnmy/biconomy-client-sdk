import {
  type Hex,
  type SignableMessage,
  type TypedData,
  type TypedDataDefinition,
  type WalletClient,
  getAddress,
} from "viem";
import type { SmartAccountSigner } from "../utils/Types.js";

export class WalletClientSigner implements SmartAccountSigner<WalletClient> {
  signerType: string;
  inner: WalletClient;

  constructor(client: WalletClient, signerType: string) {
    this.inner = client;
    if (!signerType) {
      throw new Error(`InvalidSignerTypeError: ${signerType}`);
    }
    this.signerType = signerType;
  }

  getAddress: () => Promise<`0x${string}`> = async () => {
    const addresses = await this.inner.getAddresses();
    return getAddress(addresses[0]);
  };

  readonly signMessage: (message: SignableMessage) => Promise<`0x${string}`> =
    async (message) => {
      const account = this.inner.account ?? (await this.getAddress());

      return this.inner.signMessage({ message, account });
    };

  signTypedData = async <
    const TTypedData extends TypedData | { [key: string]: unknown },
    TPrimaryType extends string = string,
  >(
    typedData: TypedDataDefinition<TTypedData, TPrimaryType>,
  ): Promise<Hex> => {
    const account = this.inner.account ?? (await this.getAddress());

    return this.inner.signTypedData({
      account,
      ...typedData,
    });
  };
}
