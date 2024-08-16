export const NexusAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "anEntryPoint",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "AccountAccessUnauthorized",
    type: "error"
  },
  {
    inputs: [],
    name: "CannotRemoveLastValidator",
    type: "error"
  },
  {
    inputs: [],
    name: "EnableModeSigError",
    type: "error"
  },
  {
    inputs: [],
    name: "EntryPointCanNotBeZero",
    type: "error"
  },
  {
    inputs: [],
    name: "ExecutionFailed",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4"
      }
    ],
    name: "FallbackAlreadyInstalledForSelector",
    type: "error"
  },
  {
    inputs: [],
    name: "FallbackHandlerUninstallFailed",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4"
      }
    ],
    name: "FallbackNotInstalledForSelector",
    type: "error"
  },
  {
    inputs: [],
    name: "FallbackSelectorForbidden",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "currentHook",
        type: "address"
      }
    ],
    name: "HookAlreadyInstalled",
    type: "error"
  },
  {
    inputs: [],
    name: "HookPostCheckFailed",
    type: "error"
  },
  {
    inputs: [],
    name: "ImplementationIsNotAContract",
    type: "error"
  },
  {
    inputs: [],
    name: "InnerCallFailed",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidImplementationAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidInput",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "InvalidModule",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      }
    ],
    name: "InvalidModuleTypeId",
    type: "error"
  },
  {
    inputs: [],
    name: "LinkedList_AlreadyInitialized",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "entry",
        type: "address"
      }
    ],
    name: "LinkedList_EntryAlreadyInList",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "entry",
        type: "address"
      }
    ],
    name: "LinkedList_InvalidEntry",
    type: "error"
  },
  {
    inputs: [],
    name: "LinkedList_InvalidPage",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      }
    ],
    name: "MismatchModuleTypeId",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4"
      }
    ],
    name: "MissingFallbackHandler",
    type: "error"
  },
  {
    inputs: [],
    name: "ModuleAddressCanNotBeZero",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "ModuleAlreadyInstalled",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "ModuleNotInstalled",
    type: "error"
  },
  {
    inputs: [],
    name: "NexusInitializationFailed",
    type: "error"
  },
  {
    inputs: [],
    name: "UnauthorizedCallContext",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address"
      }
    ],
    name: "UnauthorizedOperation",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "CallType",
        name: "callType",
        type: "bytes1"
      }
    ],
    name: "UnsupportedCallType",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "ExecType",
        name: "execType",
        type: "bytes1"
      }
    ],
    name: "UnsupportedExecType",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      }
    ],
    name: "UnsupportedModuleType",
    type: "error"
  },
  {
    inputs: [],
    name: "UpgradeFailed",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IERC7484",
        name: "registry",
        type: "address"
      }
    ],
    name: "ERC7484RegistryConfigured",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes"
          },
          {
            internalType: "bytes32",
            name: "accountGasLimits",
            type: "bytes32"
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256"
          },
          {
            internalType: "bytes32",
            name: "gasFees",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "paymasterAndData",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        indexed: false,
        internalType: "struct PackedUserOperation",
        name: "userOp",
        type: "tuple"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "innerCallRet",
        type: "bytes"
      }
    ],
    name: "Executed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "ModuleInstalled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "ModuleUninstalled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "batchExecutionindex",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "result",
        type: "bytes"
      }
    ],
    name: "TryDelegateCallUnsuccessful",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "batchExecutionindex",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "result",
        type: "bytes"
      }
    ],
    name: "TryExecuteUnsuccessful",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address"
      }
    ],
    name: "Upgraded",
    type: "event"
  },
  {
    stateMutability: "payable",
    type: "fallback"
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "accountId",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [],
    name: "addDeposit",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1"
      },
      {
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        internalType: "string",
        name: "version",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address"
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32"
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "entryPoint",
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
        internalType: "ExecutionMode",
        name: "mode",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "executionCalldata",
        type: "bytes"
      }
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "ExecutionMode",
        name: "mode",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "executionCalldata",
        type: "bytes"
      }
    ],
    name: "executeFromExecutor",
    outputs: [
      {
        internalType: "bytes[]",
        name: "returnData",
        type: "bytes[]"
      }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes"
          },
          {
            internalType: "bytes32",
            name: "accountGasLimits",
            type: "bytes32"
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256"
          },
          {
            internalType: "bytes32",
            name: "gasFees",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "paymasterAndData",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        internalType: "struct PackedUserOperation",
        name: "userOp",
        type: "tuple"
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    name: "executeUserOp",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "getActiveHook",
    outputs: [
      {
        internalType: "address",
        name: "hook",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getDeposit",
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
    inputs: [
      {
        internalType: "address",
        name: "cursor",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "size",
        type: "uint256"
      }
    ],
    name: "getExecutorsPaginated",
    outputs: [
      {
        internalType: "address[]",
        name: "array",
        type: "address[]"
      },
      {
        internalType: "address",
        name: "next",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4"
      }
    ],
    name: "getFallbackHandlerBySelector",
    outputs: [
      {
        internalType: "CallType",
        name: "",
        type: "bytes1"
      },
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
    inputs: [],
    name: "getImplementation",
    outputs: [
      {
        internalType: "address",
        name: "implementation",
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
        name: "cursor",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "size",
        type: "uint256"
      }
    ],
    name: "getValidatorsPaginated",
    outputs: [
      {
        internalType: "address[]",
        name: "array",
        type: "address[]"
      },
      {
        internalType: "address",
        name: "next",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "structHash",
        type: "bytes32"
      }
    ],
    name: "hashTypedData",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
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
      }
    ],
    name: "initializeAccount",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "initData",
        type: "bytes"
      }
    ],
    name: "installModule",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "additionalContext",
        type: "bytes"
      }
    ],
    name: "isModuleInstalled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "hash",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes"
      }
    ],
    name: "isValidSignature",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint192",
        name: "key",
        type: "uint192"
      }
    ],
    name: "nonce",
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
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "registry",
    outputs: [
      {
        internalType: "contract IERC7484",
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
        internalType: "contract IERC7484",
        name: "newRegistry",
        type: "address"
      },
      {
        internalType: "address[]",
        name: "attesters",
        type: "address[]"
      },
      {
        internalType: "uint8",
        name: "threshold",
        type: "uint8"
      }
    ],
    name: "setRegistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "ExecutionMode",
        name: "mode",
        type: "bytes32"
      }
    ],
    name: "supportsExecutionMode",
    outputs: [
      {
        internalType: "bool",
        name: "isSupported",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      }
    ],
    name: "supportsModule",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "supportsNestedTypedDataSign",
    outputs: [
      {
        internalType: "bytes32",
        name: "result",
        type: "bytes32"
      }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "deInitData",
        type: "bytes"
      }
    ],
    name: "uninstallModule",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes"
      }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes"
          },
          {
            internalType: "bytes32",
            name: "accountGasLimits",
            type: "bytes32"
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256"
          },
          {
            internalType: "bytes32",
            name: "gasFees",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "paymasterAndData",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        internalType: "struct PackedUserOperation",
        name: "op",
        type: "tuple"
      },
      {
        internalType: "bytes32",
        name: "userOpHash",
        type: "bytes32"
      },
      {
        internalType: "uint256",
        name: "missingAccountFunds",
        type: "uint256"
      }
    ],
    name: "validateUserOp",
    outputs: [
      {
        internalType: "uint256",
        name: "validationData",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "withdrawDepositTo",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    stateMutability: "payable",
    type: "receive"
  }
] as const
