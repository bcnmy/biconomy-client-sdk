import { BigNumber, Bytes } from "ethers";

/**
 * @description this function will return current timestamp in seconds
 * @returns Number
 */
export const getTimestampInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const isNullOrUndefined = (value: string | number | bigint | BigNumber | Bytes | undefined): value is undefined => {
  return value === null || value === undefined;
};
