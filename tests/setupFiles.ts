import { test } from "vitest";

export const testOnlyOnSpecificNetwork = (chainId: number) => {
  return Number(process.env.CHAIN_ID || 0) === chainId ? test : test.skip;
};

export const testOnlyOnOptimism = testOnlyOnSpecificNetwork(10);
export const testOnlyOnArbitrum = testOnlyOnSpecificNetwork(42161);
export const testOnlyOnBaseSopelia = testOnlyOnSpecificNetwork(84532);
