/**
 * @description this function will return current timestamp in seconds
 * @returns Number
 */
export const getTimestampInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};
