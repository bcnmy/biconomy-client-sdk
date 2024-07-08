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
