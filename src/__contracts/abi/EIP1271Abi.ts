export const EIP1271Abi = [
    {
        type: "function",
        name: "eip712Domain",
        inputs: [],
        outputs: [
            { name: "fields", type: "bytes1", internalType: "bytes1" },
            { name: "name", type: "string", internalType: "string" },
            { name: "version", type: "string", internalType: "string" },
            { name: "chainId", type: "uint256", internalType: "uint256" },
            {
                name: "verifyingContract",
                type: "address",
                internalType: "address"
            },
            { name: "salt", type: "bytes32", internalType: "bytes32" },
            { name: "extensions", type: "uint256[]", internalType: "uint256[]" }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "isValidSignature",
        inputs: [
            { name: "data", type: "bytes32", internalType: "bytes32" },
            { name: "signature", type: "bytes", internalType: "bytes" }
        ],
        outputs: [
            { name: "magicValue", type: "bytes4", internalType: "bytes4" }
        ],
        stateMutability: "view"
    }
] as const
