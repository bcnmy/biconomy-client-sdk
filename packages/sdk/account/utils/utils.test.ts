import { ParamType, ethers } from "ethers"
import { type AbiParameter, encodeAbiParameters } from "viem"
import { describe, expect, test } from "vitest"

describe("utils", async () => {
  test.concurrent(
    "should have consistent behaviour between ethers.AbiCoder.defaultAbiCoder() and viem.encodeAbiParameters()",
    async () => {
      const expectedResult =
        "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000090f79bf6eb2c4f870365e785982e1f101e93b90600000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000090f79bf6eb2c4f870365e785982e1f101e93b906000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000"

      const Executions = ParamType.from({
        type: "tuple(address,uint256,bytes)[]",
        baseType: "tuple",
        name: "executions",
        arrayLength: null,
        components: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "callData", type: "bytes" }
        ]
      })

      const viemExecutions: AbiParameter = {
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "callData", type: "bytes" }
        ]
      }

      const txs = [
        {
          target: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          callData: "0x",
          value: 1n
        },
        {
          target: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          callData: "0x",
          value: 1n
        }
      ]

      const executionCalldataPrepWithEthers =
        ethers.AbiCoder.defaultAbiCoder().encode([Executions], [txs])

      const executionCalldataPrepWithViem = encodeAbiParameters(
        [viemExecutions],
        [txs]
      )

      expect(executionCalldataPrepWithEthers).toBe(expectedResult)
      expect(executionCalldataPrepWithViem).toBe(expectedResult)
    }
  )
})
