/** 
 * @description The polling interval per chain for the tx receipt in milliseconds. Default value is 5 seconds 
*/
export const UserOpReceiptIntervals: { [key in number]?: number } = {
  [1]: 10000,
};

/** 
 * @description The polling interval per chain for the tx hash in milliseconds. Default value is 0.5 seconds 
 */
export const UserOpWaitForTxHashIntervals: { [key in number]?: number } = {
  [1]: 1000,
};

/** 
 * @description The maximum duration in milliseconds per chain to wait for the tx receipt. Default value is 30 seconds
 */
export const UserOpReceiptMaxDurationIntervals: { [key in number]?: number } = {
  [1]: 300000,
  [80001]: 50000,
  [137]: 60000,
  [56]: 50000,
  [97]: 50000,
  [421613]: 50000,
  [42161]: 50000,
  [59140]: 50000, // linea testnet
};

/** 
 * @description The maximum duration in milliseconds per chain to wait for the tx hash. Default value is 20 seconds
 */
export const UserOpWaitForTxHashMaxDurationIntervals: { [key in number]?: number } = {
  [1]: 20000,
};

export const DEFAULT_ENTRYPOINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
