import * as fs from "fs";
import { Wallet, Signer } from "ethers";
import { ISessionStorage, SessionLeafNode, SessionSearchParam, SessionStatus } from "interfaces/ISessionStorage";

export class SessionFileStorage implements ISessionStorage {
  private smartAccountAddress: string;
  private filePath: string;

  constructor(smartAccountAddress: string, filePath: string) {
    this.smartAccountAddress = smartAccountAddress.toLowerCase();
    this.filePath = filePath;
  }

  private async readDataFromFile(type: "sessions" | "signers"): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.getStorageFilePath(type), "utf8", (err, data) => {
        if (err) {
          // Handle errors appropriately
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
  }

  private getStorageFilePath(type: "sessions" | "signers"): string {
    return `${this.smartAccountAddress}_${type}.json`;
  }

  private async writeDataToFile(data: any, type: "sessions" | "signers"): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = this.getStorageFilePath(type);
      fs.writeFile(filePath, JSON.stringify(data), "utf8", (err) => {
        if (err) {
          // Handle errors appropriately
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private validateSearchParam(param: SessionSearchParam): void {
    if (param.sessionID) {
      return;
    } else if (!param.sessionID && param.sessionPublicKey && param.sessionValidationModule) {
      return;
    } else {
      throw new Error("Either pass sessionId or a combination of sessionPublicKey and sessionValidationModule address.");
    }
  }

  private async getSessionStore(): Promise<any> {
    try {
      const data = await this.readDataFromFile("sessions");
      return data || { merkleRoot: "", leafNodes: [] };
    } catch (error) {
      // Handle errors appropriately
      throw error;
    }
  }

  private async getSignerStore(): Promise<any> {
    try {
      const data = await this.readDataFromFile("signers");
      return data || {};
    } catch (error) {
      // Handle errors appropriately
      throw error;
    }
  }

  private getStorageKey(type: "sessions" | "signers"): string {
    return `${this.smartAccountAddress}_${type}`;
  }

  private toLowercaseAddress(address: string): string {
    return address.toLowerCase();
  }

  async addSessionData(leaf: SessionLeafNode): Promise<void> {
    const data = await this.getSessionStore();
    leaf.sessionValidationModule = this.toLowercaseAddress(leaf.sessionValidationModule);
    leaf.sessionPublicKey = this.toLowercaseAddress(leaf.sessionPublicKey);
    data.leafNodes.push(leaf);
    await this.writeDataToFile(data, "sessions"); // Use 'sessions' as the type
  }

  async updateSessionStatus(param: SessionSearchParam, status: SessionStatus): Promise<void> {
    this.validateSearchParam(param);

    const data = this.getSessionStore();
    const session = data.leafNodes.find((s: SessionLeafNode) => {
      if (param.sessionID) {
        return s.sessionID === param.sessionID;
      } else if (param.sessionPublicKey && param.sessionValidationModule) {
        return (
          s.sessionPublicKey === this.toLowercaseAddress(param.sessionPublicKey) &&
          s.sessionValidationModule === this.toLowercaseAddress(param.sessionValidationModule)
        );
      } else {
        return undefined;
      }
    });

    if (!session) {
      throw new Error("Session not found.");
    }

    session.status = status;
    await this.writeDataToFile(data, "sessions"); // Use 'sessions' as the type
  }

  async clearPendingSessions(): Promise<void> {
    const data = this.getSessionStore();
    data.leafNodes = data.leafNodes.filter((s: SessionLeafNode) => s.status !== "PENDING");
    await this.writeDataToFile(data, "sessions"); // Use 'sessions' as the type
  }

  async addSigner(signer?: Wallet): Promise<Wallet> {
    const signers = this.getSignerStore();
    if (!signer) {
      signer = Wallet.createRandom();
    }
    signers[this.toLowercaseAddress(signer.publicKey)] = {
      privateKey: signer.privateKey,
      publicKey: signer.publicKey,
    };
    await this.writeDataToFile(signers, "signers"); // Use 'signers' as the type
    return signer;
  }
  async getSignerByKey(sessionPublicKey: string): Promise<Signer> {
    const signers = this.getSignerStore();
    const signerData = signers[this.toLowercaseAddress(sessionPublicKey)];
    if (!signerData) {
      throw new Error("Signer not found.");
    }
    const signer = new Wallet(signerData.privateKey);
    return signer;
  }

  async getSignerBySession(param: SessionSearchParam): Promise<Signer> {
    const session = await this.getSessionData(param);
    return this.getSignerByKey(session.sessionPublicKey);
  }

  async getAllSessionData(param?: SessionSearchParam): Promise<SessionLeafNode[]> {
    const sessions = this.getSessionStore().leafNodes;
    if (!param || !param.status) {
      return sessions;
    }
    return sessions.filter((s: SessionLeafNode) => s.status === param.status);
  }

  async getMerkleRoot(): Promise<string> {
    return this.getSessionStore().merkleRoot;
  }

  async setMerkleRoot(merkleRoot: string): Promise<void> {
    const data = this.getSessionStore();
    data.merkleRoot = merkleRoot;
    await this.writeDataToFile(data, "sessions"); // Use 'sessions' as the type
  }
}
