/* eslint-disable no-console */
/**
 * Single class to be used for logging purpose.
 *
 * @param {any} message Message to be logged
 */
class Logger {
  // By default, the logger is not in debug mode.
  static isDebug: boolean = process.env.BICONOMY_SDK_DEBUG === "true" ? true : process.env.REACT_APP_BICONOMY_SDK_DEBUG === "true" ? true : false;

  /**
   * \x1b[0m is an escape sequence to reset the color of the text
   * All color codes used - 31 - Red, 33 - Yellow, 34 - Blue, 35 - Magenta, 36 - Cyan
   * log -   Magenta[time]               Cyan[message]:  [value]
   * warn -  Magenta[time] Yellow[WARN]: Cyan[message]:  [value]
   * error - Magenta[time] Red[ERROR]:   Cyan[message]:  [value]
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  static log(message: string, value?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[36m${message}\x1b[0m:`;

    if (Logger.isDebug) {
      console.log(logMessage, value === undefined ? "" : value);
    }
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  static warn(message: string, value?: any): void {
    const timestamp = new Date().toISOString();
    const warnMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[33mWARN\x1b[0m: \x1b[36m${message}\x1b[0m`;

    if (Logger.isDebug) {
      console.warn(warnMessage, value === undefined ? "" : value);
    }
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  static error(message: string, value?: any): void {
    const timestamp = new Date().toISOString();
    const errorMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[31mERROR\x1b[0m: \x1b[36m${message}\x1b[0m`;

    if (Logger.isDebug) {
      console.error(errorMessage, value === undefined ? "" : value);
    }
  }
}

export { Logger };
