import { Hex, PublicClient } from "viem";

export const checkBalance = (publicClient: PublicClient, address: Hex, tokenAddress?: Hex) => {
  if (!tokenAddress) {
    return publicClient.getBalance({ address });
  } else {
    return publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          constant: true,
          inputs: [
            {
              name: "_owner",
              type: "address",
            },
          ],
          name: "balanceOf",
          outputs: [
            {
              name: "balance",
              type: "uint256",
            },
          ],
          payable: false,
          type: "function",
        },
      ],
      functionName: "balanceOf",
      // @ts-ignore
      args: [address],
    });
  }
};
