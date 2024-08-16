import { concat, pad } from "viem"
import {
  CALLTYPE_BATCH,
  CALLTYPE_SINGLE,
  EXECTYPE_DEFAULT,
  EXECTYPE_DELEGATE,
  EXECTYPE_TRY,
  MODE_DEFAULT,
  MODE_PAYLOAD,
  UNUSED
} from "./Types"

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
  [11155111]: 50000,
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

export const SDK_VERSION = "4.4.5"

export const EXECUTE_SINGLE = concat([
  CALLTYPE_SINGLE,
  EXECTYPE_DEFAULT,
  MODE_DEFAULT,
  UNUSED,
  MODE_PAYLOAD
])

export const EXECUTE_BATCH = concat([
  CALLTYPE_BATCH,
  EXECTYPE_DEFAULT,
  MODE_DEFAULT,
  UNUSED,
  MODE_PAYLOAD
])

export const ACCOUNT_MODES = {
  DEFAULT_SINGLE: concat([
    pad(EXECTYPE_DEFAULT, { size: 1 }),
    pad(CALLTYPE_SINGLE, { size: 1 }),
    pad(UNUSED, { size: 4 }),
    pad(MODE_DEFAULT, { size: 4 }),
    pad(MODE_PAYLOAD, { size: 22 })
  ]),
  DEFAULT_BATCH: concat([
    pad(EXECTYPE_DEFAULT, { size: 1 }),
    pad(CALLTYPE_BATCH, { size: 1 }),
    pad(UNUSED, { size: 4 }),
    pad(MODE_DEFAULT, { size: 4 }),
    pad(MODE_PAYLOAD, { size: 22 })
  ]),
  TRY_BATCH: concat([
    pad(EXECTYPE_TRY, { size: 1 }),
    pad(CALLTYPE_BATCH, { size: 1 }),
    pad(UNUSED, { size: 4 }),
    pad(MODE_DEFAULT, { size: 4 }),
    pad(MODE_PAYLOAD, { size: 22 })
  ]),
  TRY_SINGLE: concat([
    pad(EXECTYPE_TRY, { size: 1 }),
    pad(CALLTYPE_SINGLE, { size: 1 }),
    pad(UNUSED, { size: 4 }),
    pad(MODE_DEFAULT, { size: 4 }),
    pad(MODE_PAYLOAD, { size: 22 })
  ]),
  DELEGATE_SINGLE: concat([
    pad(EXECTYPE_DELEGATE, { size: 1 }),
    pad(CALLTYPE_SINGLE, { size: 1 }),
    pad(UNUSED, { size: 4 }),
    pad(MODE_DEFAULT, { size: 4 }),
    pad(MODE_PAYLOAD, { size: 22 })
  ])
}
