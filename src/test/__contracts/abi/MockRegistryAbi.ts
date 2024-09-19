export const MockRegistryAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "Log",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [],
    name: "NewTrustedAttesters",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "address[]",
        name: "attesters",
        type: "address[]"
      },
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      }
    ],
    name: "check",
    outputs: [],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "moduleType",
        type: "uint256"
      },
      {
        internalType: "address[]",
        name: "attesters",
        type: "address[]"
      },
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256"
      }
    ],
    name: "check",
    outputs: [],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "moduleType",
        type: "uint256"
      }
    ],
    name: "check",
    outputs: [],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "check",
    outputs: [],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "smartAccount",
        type: "address"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "checkForAccount",
    outputs: [],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "smartAccount",
        type: "address"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "moduleType",
        type: "uint256"
      }
    ],
    name: "checkForAccount",
    outputs: [],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      },
      {
        internalType: "address[]",
        name: "attesters",
        type: "address[]"
      }
    ],
    name: "trustAttesters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const
