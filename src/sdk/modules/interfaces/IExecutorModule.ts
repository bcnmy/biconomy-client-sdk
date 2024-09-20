import type { Hex } from "viem"

export interface IExecutorModule {
  getAddress(): Hex
  getVersion(): string
}
