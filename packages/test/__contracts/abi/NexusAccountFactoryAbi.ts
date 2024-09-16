export const NexusAccountFactoryAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation_",
        type: "address"
      },
      {
        internalType: "address",
        name: "owner_",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "AccountAlreadyDeployed",
    type: "error"
  },
  {
    inputs: [],
    name: "AlreadyInitialized",
    type: "error"
  },
  {
    inputs: [],
    name: "ImplementationAddressCanNotBeZero",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidEntryPointAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "NewOwnerIsZeroAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "NoHandoverRequest",
    type: "error"
  },
  {
    inputs: [],
    name: "Unauthorized",
    type: "error"
  },
  {
    inputs: [],
    name: "ZeroAddressNotAllowed",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "initData",
        type: "bytes"
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "salt",
        type: "bytes32"
      }
    ],
    name: "AccountCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pendingOwner",
        type: "address"
      }
    ],
    name: "OwnershipHandoverCanceled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pendingOwner",
        type: "address"
      }
    ],
    name: "OwnershipHandoverRequested",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    inputs: [],
    name: "ACCOUNT_IMPLEMENTATION",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "epAddress",
        type: "address"
      },
      {
        internalType: "uint32",
        name: "unstakeDelaySec",
        type: "uint32"
      }
    ],
    name: "addStake",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "cancelOwnershipHandover",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pendingOwner",
        type: "address"
      }
    ],
    name: "completeOwnershipHandover",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "initData",
        type: "bytes"
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32"
      }
    ],
    name: "computeAccountAddress",
    outputs: [
      {
        internalType: "address payable",
        name: "expectedAddress",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "initData",
        type: "bytes"
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32"
      }
    ],
    name: "createAccount",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "result",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pendingOwner",
        type: "address"
      }
    ],
    name: "ownershipHandoverExpiresAt",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "requestOwnershipHandover",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "epAddress",
        type: "address"
      }
    ],
    name: "unlockStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "epAddress",
        type: "address"
      },
      {
        internalType: "address payable",
        name: "withdrawAddress",
        type: "address"
      }
    ],
    name: "withdrawStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const
