export const CounterAbi = [
  {
    inputs: [],
    name: "decrementNumber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getNumber",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "incrementNumber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "revertOperation",
    outputs: [],
    stateMutability: "pure",
    type: "function"
  }
] as const
