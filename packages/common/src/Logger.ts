/**
 * Single method to be used for logging purpose.
 *
 * @param {any} message Message to be logged
 */
export function _logMessage(message: any) {
  // Method would be called ifLogsEnabled is true
  if (console.log) {
    console.log(message)
  }
}
