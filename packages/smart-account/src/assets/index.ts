export const MultiSend = {
  defaultAddress: '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
  released: true,
  contractName: 'MultiSend',
  version: '1.0.1',
  networkAddresses: {
    '1': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '4': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '5': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '42': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '88': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '100': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '246': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '73799': '0xF9DC4a9B8b551f693a10EcB5F931fE2E1a9156f0',
    '31338': '0x1A3F36c656Da24c18C703B8c2d1829F5D32E8E49'
  },
  abi: [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: 'transactions',
          type: 'bytes'
        }
      ],
      name: 'multiSend',
      outputs: [],
      stateMutability: 'payable',
      type: 'function'
    }
  ]
}

export const MultiSendCallOnly = {
  defaultAddress: '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
  released: true,
  contractName: 'MultiSendCallOnly',
  version: '1.0.1',
  networkAddresses: {
    '1': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '4': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '5': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '42': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '88': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '100': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '246': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '73799': '0xa72E2c9EC14DDee494F551AAe9885158105F809c',
    '31338': '0x1A3F36c656Da24c18C703B8c2d1829F5D32E8E49'
  },
  abi: [
    {
      inputs: [
        {
          internalType: 'bytes',
          name: 'transactions',
          type: 'bytes'
        }
      ],
      name: 'multiSend',
      outputs: [],
      stateMutability: 'payable',
      type: 'function'
    }
  ]
}

export const SmartWallet = {
  defaultAddress: '0x056DcE811A2b695171274855E7246039Df298158',
  released: true,
  contractName: 'SmartWallet',
  version: '1.0.1',
  networkAddresses: {
    '1': '0x056DcE811A2b695171274855E7246039Df298158',
    '4': '0x056DcE811A2b695171274855E7246039Df298158',
    '5': '0x056DcE811A2b695171274855E7246039Df298158',
    '42': '0x056DcE811A2b695171274855E7246039Df298158',
    '100': '0x056DcE811A2b695171274855E7246039Df298158',
    '31338': '0x0ba464506a3D66C962121e3C25ed56678A2585B6'
  },
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'handler',
          type: 'address'
        }
      ],
      name: 'ChangedFallbackHandler',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'DisabledModule',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: '_scw',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: '_oldEOA',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: '_newEOA',
          type: 'address'
        }
      ],
      name: 'EOAChanged',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'EnabledModule',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'oldEntryPoint',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'newEntryPoint',
          type: 'address'
        }
      ],
      name: 'EntryPointChanged',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'bytes32',
          name: 'txHash',
          type: 'bytes32'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'payment',
          type: 'uint256'
        }
      ],
      name: 'ExecutionFailure',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'ExecutionFromModuleFailure',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'ExecutionFromModuleSuccess',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'bytes32',
          name: 'txHash',
          type: 'bytes32'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'payment',
          type: 'uint256'
        }
      ],
      name: 'ExecutionSuccess',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'newImplementation',
          type: 'address'
        }
      ],
      name: 'ImplementationUpdated',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint8',
          name: 'version',
          type: 'uint8'
        }
      ],
      name: 'Initialized',
      type: 'event'
    },
    {
      stateMutability: 'nonpayable',
      type: 'fallback'
    },
    {
      inputs: [],
      name: 'VERSION',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'dataHash',
          type: 'bytes32'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'bytes',
          name: 'signatures',
          type: 'bytes'
        }
      ],
      name: 'checkSignatures',
      outputs: [],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'prevModule',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'disableModule',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'domainSeparator',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'enableModule',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'to',
              type: 'address'
            },
            {
              internalType: 'uint256',
              name: 'value',
              type: 'uint256'
            },
            {
              internalType: 'bytes',
              name: 'data',
              type: 'bytes'
            },
            {
              internalType: 'enum Enum.Operation',
              name: 'operation',
              type: 'uint8'
            },
            {
              internalType: 'uint256',
              name: 'targetTxGas',
              type: 'uint256'
            }
          ],
          internalType: 'struct WalletStorage.Transaction',
          name: '_tx',
          type: 'tuple'
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'baseGas',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'gasPrice',
              type: 'uint256'
            },
            {
              internalType: 'address',
              name: 'gasToken',
              type: 'address'
            },
            {
              internalType: 'address payable',
              name: 'refundReceiver',
              type: 'address'
            }
          ],
          internalType: 'struct WalletStorage.FeeRefund',
          name: 'refundInfo',
          type: 'tuple'
        },
        {
          internalType: 'uint256',
          name: '_nonce',
          type: 'uint256'
        }
      ],
      name: 'encodeTransactionData',
      outputs: [
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'entryPoint',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'dest',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'func',
          type: 'bytes'
        }
      ],
      name: 'exec',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address[]',
          name: 'dest',
          type: 'address[]'
        },
        {
          internalType: 'bytes[]',
          name: 'func',
          type: 'bytes[]'
        }
      ],
      name: 'execBatch',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'dest',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'func',
          type: 'bytes'
        }
      ],
      name: 'execFromEntryPoint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'to',
              type: 'address'
            },
            {
              internalType: 'uint256',
              name: 'value',
              type: 'uint256'
            },
            {
              internalType: 'bytes',
              name: 'data',
              type: 'bytes'
            },
            {
              internalType: 'enum Enum.Operation',
              name: 'operation',
              type: 'uint8'
            },
            {
              internalType: 'uint256',
              name: 'targetTxGas',
              type: 'uint256'
            }
          ],
          internalType: 'struct WalletStorage.Transaction',
          name: '_tx',
          type: 'tuple'
        },
        {
          internalType: 'uint256',
          name: 'batchId',
          type: 'uint256'
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'baseGas',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'gasPrice',
              type: 'uint256'
            },
            {
              internalType: 'address',
              name: 'gasToken',
              type: 'address'
            },
            {
              internalType: 'address payable',
              name: 'refundReceiver',
              type: 'address'
            }
          ],
          internalType: 'struct WalletStorage.FeeRefund',
          name: 'refundInfo',
          type: 'tuple'
        },
        {
          internalType: 'bytes',
          name: 'signatures',
          type: 'bytes'
        }
      ],
      name: 'execTransaction',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'payable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'enum Enum.Operation',
          name: 'operation',
          type: 'uint8'
        }
      ],
      name: 'execTransactionFromModule',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'enum Enum.Operation',
          name: 'operation',
          type: 'uint8'
        }
      ],
      name: 'execTransactionFromModuleReturnData',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        },
        {
          internalType: 'bytes',
          name: 'returnData',
          type: 'bytes'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getChainId',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'start',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'pageSize',
          type: 'uint256'
        }
      ],
      name: 'getModulesPaginated',
      outputs: [
        {
          internalType: 'address[]',
          name: 'array',
          type: 'address[]'
        },
        {
          internalType: 'address',
          name: 'next',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'batchId',
          type: 'uint256'
        }
      ],
      name: 'getNonce',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'enum Enum.Operation',
          name: 'operation',
          type: 'uint8'
        },
        {
          internalType: 'uint256',
          name: 'targetTxGas',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'baseGas',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'gasPrice',
          type: 'uint256'
        },
        {
          internalType: 'address',
          name: 'gasToken',
          type: 'address'
        },
        {
          internalType: 'address payable',
          name: 'refundReceiver',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '_nonce',
          type: 'uint256'
        }
      ],
      name: 'getTransactionHash',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_owner',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_entryPoint',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_handler',
          type: 'address'
        }
      ],
      name: 'init',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'module',
          type: 'address'
        }
      ],
      name: 'isModuleEnabled',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      name: 'nonces',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'dest',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'pullTokens',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'enum Enum.Operation',
          name: 'operation',
          type: 'uint8'
        }
      ],
      name: 'requiredTxGas',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'handler',
          type: 'address'
        }
      ],
      name: 'setFallbackHandler',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_newOwner',
          type: 'address'
        }
      ],
      name: 'setOwner',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes4',
          name: 'interfaceId',
          type: 'bytes4'
        }
      ],
      name: 'supportsInterface',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address payable',
          name: 'dest',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'transfer',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_entryPoint',
          type: 'address'
        }
      ],
      name: 'updateEntryPoint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_implementation',
          type: 'address'
        }
      ],
      name: 'updateImplementation',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'sender',
              type: 'address'
            },
            {
              internalType: 'uint256',
              name: 'nonce',
              type: 'uint256'
            },
            {
              internalType: 'bytes',
              name: 'initCode',
              type: 'bytes'
            },
            {
              internalType: 'bytes',
              name: 'callData',
              type: 'bytes'
            },
            {
              internalType: 'uint256',
              name: 'callGas',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'verificationGas',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'preVerificationGas',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'maxFeePerGas',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'maxPriorityFeePerGas',
              type: 'uint256'
            },
            {
              internalType: 'address',
              name: 'paymaster',
              type: 'address'
            },
            {
              internalType: 'bytes',
              name: 'paymasterData',
              type: 'bytes'
            },
            {
              internalType: 'bytes',
              name: 'signature',
              type: 'bytes'
            }
          ],
          internalType: 'struct UserOperation',
          name: 'userOp',
          type: 'tuple'
        },
        {
          internalType: 'bytes32',
          name: 'requestId',
          type: 'bytes32'
        },
        {
          internalType: 'uint256',
          name: 'requiredPrefund',
          type: 'uint256'
        }
      ],
      name: 'validateUserOp',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
}

export const WalletFactory = {
  defaultAddress: '0x050bca32264195976Fe00BcA566B548413A9E658',
  released: true,
  contractName: 'WalletFactory',
  version: '1.0.1',
  networkAddresses: {
    '1': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '4': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '5': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '42': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '88': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '100': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '246': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '73799': '0x050bca32264195976Fe00BcA566B548413A9E658',
    '31338': '0x85c0995669f8a0173a5B5F6003DA060E8D17f0c3'
  },
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_baseImpl',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: '_proxy',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: '_implementation',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: '_owner',
          type: 'address'
        }
      ],
      name: 'WalletCreated',
      type: 'event'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_owner',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_entryPoint',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_handler',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256'
        }
      ],
      name: 'deployCounterFactualWallet',
      outputs: [
        {
          internalType: 'address',
          name: 'proxy',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_owner',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_entryPoint',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_handler',
          type: 'address'
        }
      ],
      name: 'deployWallet',
      outputs: [
        {
          internalType: 'address',
          name: 'proxy',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_owner',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256'
        }
      ],
      name: 'getAddressForCounterFactualWallet',
      outputs: [
        {
          internalType: 'address',
          name: '_wallet',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      name: 'isWalletExist',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ]
}

export const GasEstimator = {
  defaultAddress: '0xc6e8748a08e591250a3eed526e9455859633c6c4',
  released: true,
  contractName: 'WalletFactory',
  version: '1.0.1',
  networkAddresses: {
    '5': '0xc6e8748a08e591250a3eed526e9455859633c6c4'
  },
  abi: [
    {
      inputs: [
        { internalType: 'address', name: '_to', type: 'address' },
        { internalType: 'bytes', name: '_data', type: 'bytes' }
      ],
      name: 'estimate',
      outputs: [
        { internalType: 'bool', name: 'success', type: 'bool' },
        { internalType: 'bytes', name: 'result', type: 'bytes' },
        { internalType: 'uint256', name: 'gas', type: 'uint256' }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
}
