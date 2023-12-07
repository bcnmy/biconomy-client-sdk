import { BigNumber, BigNumberish, Bytes } from "ethers";

/**
 * @description this function will return current timestamp in seconds
 * @returns Number
 */
export const getTimestampInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const checkNullOrUndefined = (value: string | number | bigint | BigNumber | Bytes | undefined): boolean => {
  return value === null || value === undefined;
}
