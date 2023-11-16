import { defaultAbiCoder } from "ethers/lib/utils";
import { ISessionValidationModule } from "../interfaces/ISessionValidationModule";
import { ERC20SessionKeyData, SessionValidationModuleConfig } from "../utils/Types";

/**
 * Session validation module for ERC20 token transfers.
 * It encodes session data into a sessionKeyData bytes to be verified by ERC20SessionValidationModule on chain.
 *
 * @author Sachin Tomar <sachin.tomar@biconomy.io>
 */
export class ERC20SessionValidationModule implements ISessionValidationModule<ERC20SessionKeyData> {
  moduleAddress!: string;

  version = "V1_0_0";

  /**
   * This constructor is private. Use the static create method to instantiate ERC20SessionValidationModule
   * @param moduleConfig The configuration for the module
   * @returns An instance of ERC20SessionValidationModule
   */
  private constructor(moduleConfig: SessionValidationModuleConfig) {
    if (!moduleConfig.moduleAddress) {
      throw new Error("Module address is required");
    }
    this.moduleAddress = moduleConfig.moduleAddress;
  }

  /**
   * Asynchronously creates and initializes an instance of ERC20SessionValidationModule
   * @param moduleConfig The configuration for the module
   * @returns A Promise that resolves to an instance of ERC20SessionValidationModule
   */
  public static async create(moduleConfig: SessionValidationModuleConfig): Promise<ERC20SessionValidationModule> {
    const module = new ERC20SessionValidationModule(moduleConfig);
    return module;
  }

  async getSessionKeyData(sessionData: ERC20SessionKeyData): Promise<string> {
    this._validateSessionKeyData(sessionData);
    const sessionKeyData = defaultAbiCoder.encode(
      ["address", "address", "address", "uint256"],
      [sessionData.sessionKey, sessionData.token, sessionData.recipient, sessionData.maxAmount],
    );
    return sessionKeyData;
  }

  private _validateSessionKeyData(sessionData: ERC20SessionKeyData): void {
    if (!sessionData) {
      throw new Error("Session data is required");
    }
    if (!sessionData.sessionKey) {
      throw new Error("Session key is required in sessionData");
    }
    if (!sessionData.token) {
      throw new Error("Token address is required in sessionData");
    }
    if (!sessionData.recipient) {
      throw new Error("Recipient address is required in sessionData");
    }
    if (!sessionData.maxAmount) {
      throw new Error("MaxAmount is required in sessionData");
    }
  }

  getAddress(): string {
    return this.moduleAddress;
  }
}
