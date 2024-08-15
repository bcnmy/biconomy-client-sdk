const VARS_T0_CHECK = [
  "BICONOMY_SDK_DEBUG",
  "REACT_APP_BICONOMY_SDK_DEBUG",
  "NEXT_PUBLIC_BICONOMY_SDK_DEBUG"
]

export const isDebugging = (): boolean => {
  try {
    // @ts-ignore
    return VARS_T0_CHECK.some(
      (key) => process?.env?.[key]?.toString() === "true"
    )
  } catch (e) {
    return false
  }
}

export const pollFunction = async (
  fn: () => Promise<boolean>,
  interval: number,
  timeout: number
): Promise<boolean> => {
  const start = Date.now()
  let result = await fn()
  while (!result && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    result = await fn()
  }
  return result
}
