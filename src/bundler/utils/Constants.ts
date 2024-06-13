import { concat } from "viem"
import { CALLTYPE_BATCH, CALLTYPE_SINGLE, EXECTYPE_DEFAULT, MODE_DEFAULT, MODE_PAYLOAD, UNUSED } from "./Types"

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
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

export const SDK_VERSION = "4.4.5"

export const EXECUTE_SINGLE = concat([
  CALLTYPE_SINGLE,
  EXECTYPE_DEFAULT,
  MODE_DEFAULT,
  UNUSED,
  MODE_PAYLOAD,
])

export const EXECUTE_BATCH = concat([
  CALLTYPE_BATCH,
  EXECTYPE_DEFAULT,
  MODE_DEFAULT,
  UNUSED,
  MODE_PAYLOAD,
]);
