export const UserOpReceiptIntervals: { [key in number]?: number } = {
  [1]: 10000
}

// Note: Default value is 500(0.5sec)
export const UserOpWaitForTxHashIntervals: { [key in number]?: number } = {
  [1]: 1000
}

// Note: Default value is 30000 (30sec)
export const UserOpReceiptMaxDurationIntervals: { [key in number]?: number } = {
  [1]: 300000,
  [80002]: 50000,
  [137]: 60000,
  [56]: 50000,
  [97]: 50000,
  [421613]: 50000,
  [42161]: 50000,
  [59140]: 50000 // linea testnet
}

// Note: Default value is 20000 (20sec)
export const UserOpWaitForTxHashMaxDurationIntervals: {
  [key in number]?: number
} = {
  [1]: 20000
}

export const DEFAULT_ENTRYPOINT_ADDRESS =
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"

export const SDK_VERSION = "4.2.0"
