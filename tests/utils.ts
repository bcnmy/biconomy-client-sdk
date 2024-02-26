import { Hex, PublicClient, parseAbi } from "viem";

export const checkBalance = (publicClient: PublicClient, address: Hex, tokenAddress?: Hex): Promise<bigint> => {
  if (!tokenAddress) {
    return publicClient.getBalance({ address });
  }
  return publicClient.readContract({
    address: tokenAddress,
    abi: parseAbi(["function balanceOf(address owner) view returns (uint balance)"]),
    functionName: "balanceOf",
    // @ts-ignore
    args: [address],
  });
};

// TODO(Joe): Make human readable
export const entryPointABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "bytes", name: "initCode", type: "bytes" },
          { internalType: "bytes", name: "callData", type: "bytes" },
          { internalType: "uint256", name: "callGasLimit", type: "uint256" },
          { internalType: "uint256", name: "verificationGasLimit", type: "uint256" },
          { internalType: "uint256", name: "preVerificationGas", type: "uint256" },
          { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
          { internalType: "uint256", name: "maxPriorityFeePerGas", type: "uint256" },
          { internalType: "bytes", name: "paymasterAndData", type: "bytes" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct UserOperation",
        name: "userOp",
        type: "tuple",
      },
    ],
    name: "getUserOpHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
];
