import { hexValue } from 'ethers/lib/utils'

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const hexifyUserOp = (resolvedUserOp: any) => {
  return Object.keys(resolvedUserOp)
    .map((key) => {
      let val = resolvedUserOp[key]
      if (typeof val !== 'string' || !val.startsWith('0x')) {
        val = hexValue(val)
      }
      return [key, val]
    })
    .reduce(
      (set, [k, v]) => ({
        ...set,
        [k]: v
      }),
      {}
    )
}
