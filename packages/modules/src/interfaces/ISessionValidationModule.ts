/**
 * Interface for implementing a Session Validation Module.
 * Session Validation Modules works along with SessionKeyManager
 * and generate module specific sessionKeyData which is to be
 * verified by SessionValidationModule on chain.
 *
 * @remarks sessionData is of generic type T which is specific to the module
 *
 * @author Sachin Tomar <sachin.tomar@biconomy.io>
 */
export interface ISessionValidationModule<T> {
  getSessionKeyData(_sessionData: T): Promise<string>;
  getAddress(): string;
}
