/**
 * The exeuctor abi, used to execute transactions on the Biconomy Modular Smart Account
 */
export const BiconomyExecuteAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "dest",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256"
      },
      {
        internalType: "bytes",
        name: "func",
        type: "bytes"
      }
    ],
    name: "execute_ncC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "dest",
        type: "address[]"
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]"
      },
      {
        internalType: "bytes[]",
        name: "func",
        type: "bytes[]"
      }
    ],
    name: "executeBatch_y6U",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

/**
 * The init abi, used to initialise Biconomy Modular Smart Account / setup default k1 Validator module
 */
export const BiconomyInitAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "handler",
        type: "address"
      },
      {
        internalType: "address",
        name: "moduleSetupContract",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "moduleSetupData",
        type: "bytes"
      }
    ],
    name: "init",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "eoaOwner",
        type: "address"
      }
    ],
    name: "initForSmartAccount",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
]

export const BiconomyFactoryAbi = [
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
        internalType: "address",
        name: "initialAuthModule",
        type: "address"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    name: "AccountCreation",
    type: "event"
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
        internalType: "address",
        name: "initialAuthModule",
        type: "address"
      }
    ],
    name: "AccountCreationWithoutIndex",
    type: "event"
  },
  {
    inputs: [],
    name: "accountCreationCode",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes"
      }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "moduleSetupContract",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "moduleSetupData",
        type: "bytes"
      }
    ],
    name: "deployAccount",
    outputs: [
      {
        internalType: "address",
        name: "proxy",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "moduleSetupContract",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "moduleSetupData",
        type: "bytes"
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    name: "deployCounterFactualAccount",
    outputs: [
      {
        internalType: "address",
        name: "proxy",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "moduleSetupContract",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "moduleSetupData",
        type: "bytes"
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    name: "getAddressForCounterFactualAccount",
    outputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const

export const metaFactorytAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "factory",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "factoryData",
        type: "bytes"
      }
    ],
    name: "deployWithFactory",
    outputs: [
      {
        internalType: "address payable",
        name: "createdAccount",
        type: "address"
      }
    ],
    stateMutability: "payable",
    type: "function"
  }
] as const

export const createAccountAbi = [
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
    inputs: [
      {
        internalType: "address",
        name: "eoaOwner",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
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
  }
] as const
