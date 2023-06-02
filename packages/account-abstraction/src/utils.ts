import { hexValue } from 'ethers/lib/utils'

export const hexifyUserOp = (resolvedUserOp: any) => {
  return Object.keys(resolvedUserOp)
    .map((key) => {
      let val = (resolvedUserOp as any)[key]
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
