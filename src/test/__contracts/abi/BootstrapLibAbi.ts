export const BootstrapLibAbi = [
  {
    inputs: [
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
    name: "createArrayConfig",
    outputs: [
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
        name: "config",
        type: "tuple[]"
      }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "modules",
        type: "address[]"
      },
      {
        internalType: "bytes[]",
        name: "datas",
        type: "bytes[]"
      }
    ],
    name: "createMultipleConfigs",
    outputs: [
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
        name: "configs",
        type: "tuple[]"
      }
    ],
    stateMutability: "pure",
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
        internalType: "bytes",
        name: "data",
        type: "bytes"
      }
    ],
    name: "createSingleConfig",
    outputs: [
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
        name: "config",
        type: "tuple"
      }
    ],
    stateMutability: "pure",
    type: "function"
  }
] as const
