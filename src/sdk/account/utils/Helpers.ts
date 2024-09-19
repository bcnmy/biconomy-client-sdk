export const isDebugging = () =>
  process.env.BICONOMY_SDK_DEBUG === "true" ||
  process.env.REACT_APP_BICONOMY_SDK_DEBUG === "true" ||
  process.env.NEXT_PUBLIC_BICONOMY_SDK_DEBUG === "true"
