/**
 * Single class to be used for logging purpose.
 *
 * @param {any} message Message to be logged
 */
class Logger {
  // By default, the logger is not in debug mode.
  private readonly isDebug: boolean = false

  constructor() {
    // Check if the debug flag is set in the environment variables

    if (process.env.BICONOMY_SDK_DEBUG === 'true') {
      this.isDebug = true
    }
  }

  log(message: string, value?: any): void {
    const timestamp = new Date().toISOString()
    const logMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[36m${message}\x1b[0m:`

    if (this.isDebug) {
      console.log(logMessage, '\x1b[34m', value, '\x1b[0m')
    }
  }

  warn(message: string, value?: any): void {
    const timestamp = new Date().toISOString()
    const warnMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[33mWARN\x1b[0m: \x1b[36m${message}\x1b[0m`

    if (this.isDebug) {
      console.warn(`${warnMessage} \x1b[33m${value}\x1b[0m`)
    }
  }

  error(message: string, value?: any): void {
    const timestamp = new Date().toISOString()
    const errorMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[31mERROR\x1b[0m: \x1b[36m${message}\x1b[0m`

    if (this.isDebug) {
      console.error(`${errorMessage} \x1b[31m${value}\x1b[0m`)
    }
  }
}

export { Logger }
