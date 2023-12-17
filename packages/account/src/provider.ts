import {
  BatchUserOperationCallData,
  SendUserOperationResult,
  SmartAccountProvider,
  UserOperationCallData,
  UserOperationOverrides,
  UserOperationStruct,
} from "@alchemy/aa-core";
import type { Hex, HttpTransport } from "viem";
import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";

export class BiconomyAccountProvider extends SmartAccountProvider<HttpTransport> {
  buildUserOperation = async (
    data: UserOperationCallData | BatchUserOperationCallData,
    _overrides?: UserOperationOverrides,
  ): Promise<UserOperationStruct> => {
    if (!this.account) {
      throw new Error("account not connected!");
    }

    let callData: Hex;
    if (Array.isArray(data)) {
      callData = await this.account.encodeBatchExecute(data);
    } else if (typeof data === "string") {
      callData = data;
    } else {
      callData = await this.account.encodeExecute(data.target, data.value ?? BigInt(0), data.data);
    }
    const userOp = await (this.account as BiconomySmartAccountV2).estimateUserOpGas({
      sender: await this.getAddress(),
      nonce: await this.account.getNonce(),
      initCode: await this.account.getInitCode(),
      signature: await (this.account as BiconomySmartAccountV2).getDummySignatures(),
      callData: callData,
    });

    return userOp as UserOperationStruct;
  };

  sendUserOperation = async (data: UserOperationCallData | BatchUserOperationCallData): Promise<SendUserOperationResult> => {
    if (!this.account) {
      throw new Error("account not connected");
    }

    const userOp = await this.buildUserOperation(data);
    const userOpResponse = await (this.account as BiconomySmartAccountV2).sendUserOp(userOp);
    return {
      hash: userOpResponse.userOpHash as Hex,
      request: userOp as any,
    };
  };
}
