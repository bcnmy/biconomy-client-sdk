import { describe, expect, test } from "vitest"
import {
  extractChainIdFromBundlerUrl,
  extractChainIdFromPaymasterUrl
} from "../../src/bundler"

describe("Bundler:Utils", () => {
  describe("extractChainIdFromBundlerUrl", () => {
    test("should extract chain ID from standard v2 bundler URL", () => {
      const url =
        "https://bundler.biconomy.io/api/v2/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14"
      expect(extractChainIdFromBundlerUrl(url)).toBe(84532)
    })

    test("should extract chain ID from v3 bundler URL (Issue #593)", () => {
      const url = "https://bundler.biconomy.io/api/v3/8453/apiKey123"
      expect(extractChainIdFromBundlerUrl(url)).toBe(8453)
    })

    test("should extract chain ID from bundler URL with underscores in BUNDLER_ID", () => {
      const url = "https://bundler.biconomy.io/api/v2/713715/bundler_XXX"
      expect(extractChainIdFromBundlerUrl(url)).toBe(713715)
    })

    test("should extract chain ID from bundler URL with query parameters", () => {
      const url =
        "https://bundler.biconomy.io/api/v3/10/bundler-key?source=sdk&env=prod"
      expect(extractChainIdFromBundlerUrl(url)).toBe(10)
    })

    test("should extract chain ID from minimal bundler URL without trailing key", () => {
      const url = "https://bundler.biconomy.io/api/v3/1"
      expect(extractChainIdFromBundlerUrl(url)).toBe(1)
    })

    test("should throw 'Invalid chain id' for invalid bundler URL", () => {
      expect(() =>
        extractChainIdFromBundlerUrl("https://bundler.biconomy.io/invalid/path")
      ).toThrow("Invalid chain id")
    })

    test("should throw 'Invalid chain id' for empty or non-numeric chain ID URL", () => {
      expect(() =>
        extractChainIdFromBundlerUrl("https://bundler.biconomy.io/api/v2/abc/key")
      ).toThrow("Invalid chain id")
    })
  })

  describe("extractChainIdFromPaymasterUrl", () => {
    test("should extract chain ID from paymaster URL", () => {
      const url =
        "https://paymaster.biconomy.io/api/v1/80002/mock-paymaster-key"
      expect(extractChainIdFromPaymasterUrl(url)).toBe(80002)
    })

    test("should throw 'Invalid chain id' for invalid paymaster URL", () => {
      expect(() =>
        extractChainIdFromPaymasterUrl("https://paymaster.biconomy.io/v1/bad")
      ).toThrow("Invalid chain id")
    })
  })
})
