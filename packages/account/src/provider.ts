import {
  BatchUserOperationCallData,
  SmartAccountProvider,
  UserOperationCallData,
  UserOperationOverrides,
  UserOperationStruct,
} from "@alchemy/aa-core";
import type { Hex, HttpTransport } from "viem";
import type { UserOpResponse } from "@biconomy/bundler";
import { IHybridPaymaster, SponsorUserOperationDto, PaymasterMode } from "@biconomy/paymaster";
import { BiconomySmartAccountV2 } from "./BiconomySmartAccountV2";

export class BiconomyAccountProvider extends SmartAccountProvider<HttpTransport> {
  // Note: Not using the customMiddleware as it is the last stack happens but we need to update the signatures before the request is sent
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

  sendUserOperations = async (data: UserOperationCallData | BatchUserOperationCallData): Promise<UserOpResponse> => {
    if (!this.account) {
      throw new Error("account not connected");
    }

    const userOp = await this.buildUserOperation(data);

    const biconomyAccount = this.account as BiconomySmartAccountV2;
    if (biconomyAccount.paymaster !== undefined) {
      try {
        const paymasterData = await (biconomyAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>).getPaymasterAndData(userOp, {
          mode: PaymasterMode.SPONSORED,
        });
        userOp.paymasterAndData = paymasterData.paymasterAndData;
        userOp.callGasLimit = paymasterData.callGasLimit;
        userOp.verificationGasLimit = paymasterData.verificationGasLimit;
        userOp.preVerificationGas = paymasterData.preVerificationGas;
      } catch (e: any) {
        console.error("Error while fetching paymaster data", e);
      }
    }

    const userOpResponse = await biconomyAccount.sendUserOp(userOp);
    return userOpResponse;
  };
}
