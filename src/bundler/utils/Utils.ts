import { toHex } from "viem"

export const extractChainIdFromBundlerUrl = (url: string): number => {
  try {
    const regex = /\/api\/v2\/(\d+)\/[a-zA-Z0-9.-]+$/
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const match = regex.exec(url)!
    return Number.parseInt(match[1])
  } catch (error) {
    throw new Error("Invalid chain id")
  }
}

export const extractChainIdFromPaymasterUrl = (url: string): number => {
  try {
    const regex = /\/api\/v\d+\/(\d+)\//
    const match = regex.exec(url)
    if (!match) {
      throw new Error("Invalid URL format")
    }
    return Number.parseInt(match[1])
  } catch (error) {
    throw new Error("Invalid chain id")
  }
}

export function deepHexlify(obj: any): any {
  if (typeof obj === "function") {
      return undefined
  }
  if (obj == null || typeof obj === "string" || typeof obj === "boolean") {
      return obj
  }

  if (typeof obj === "bigint") {
      return toHex(obj)
  }

  if (obj._isBigNumber != null || typeof obj !== "object") {
      return toHex(obj).replace(/^0x0/, "0x")
  }
  if (Array.isArray(obj)) {
      return obj.map((member) => deepHexlify(member))
  }
  return Object.keys(obj).reduce(
      // biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
      (set: any, key: string) => {
          set[key] = deepHexlify(obj[key])
          return set
      },
      {}
  )
}