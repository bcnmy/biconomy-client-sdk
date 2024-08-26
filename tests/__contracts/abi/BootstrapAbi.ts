export const BootstrapAbi = [
  {
    inputs: [],
    name: "CanNotRemoveLastValidator",
    type: "error"
  },
  {
    inputs: [],
    name: "EnableModeSigError",
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
    name: "FallbackCallTypeInvalid",
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
    name: "NoValidatorInstalled",
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
        internalType: "address",
        name: "module",
        type: "address"
      }
    ],
    name: "ValidatorNotInstalled",
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
    stateMutability: "payable",
    type: "fallback"
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
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "validators",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "executors",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig",
        name: "hook",
        type: "tuple"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "fallbacks",
        type: "tuple[]"
      },
      {
        internalType: "contract IERC7484",
        name: "registry",
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
    name: "getInitNexusCalldata",
    outputs: [
      {
        internalType: "bytes",
        name: "init",
        type: "bytes"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "validators",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig",
        name: "hook",
        type: "tuple"
      },
      {
        internalType: "contract IERC7484",
        name: "registry",
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
    name: "getInitNexusScopedCalldata",
    outputs: [
      {
        internalType: "bytes",
        name: "init",
        type: "bytes"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig",
        name: "validator",
        type: "tuple"
      },
      {
        internalType: "contract IERC7484",
        name: "registry",
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
    name: "getInitNexusWithSingleValidatorCalldata",
    outputs: [
      {
        internalType: "bytes",
        name: "init",
        type: "bytes"
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
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "validators",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "executors",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig",
        name: "hook",
        type: "tuple"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "fallbacks",
        type: "tuple[]"
      },
      {
        internalType: "contract IERC7484",
        name: "registry",
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
    name: "initNexus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig[]",
        name: "validators",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BootstrapConfig",
        name: "hook",
        type: "tuple"
      },
      {
        internalType: "contract IERC7484",
        name: "registry",
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
    name: "initNexusScoped",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "contract IModule",
        name: "validator",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes"
      },
      {
        internalType: "contract IERC7484",
        name: "registry",
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
    name: "initNexusWithSingleValidator",
    outputs: [],
    stateMutability: "nonpayable",
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
    stateMutability: "payable",
    type: "receive"
  }
] as const
