import { Wallet, Signer } from "ethers";
import { ISessionStorage, SessionLeafNode, SessionSearchParam, SessionStatus } from "../interfaces/ISessionStorage";

export class SessionLocalStorage implements ISessionStorage {
  private smartAccountAddress: string;

  constructor(smartAccountAddress: string) {
    this.smartAccountAddress = smartAccountAddress.toLowerCase();
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

  private getSessionStore(): any {
    const data = localStorage.getItem(this.getStorageKey("sessions"));
    return data ? JSON.parse(data) : { merkleRoot: "", leafNodes: [] };
  }

  private getSignerStore(): any {
    const data = localStorage.getItem(this.getStorageKey("signers"));
    return data ? JSON.parse(data) : {};
  }

  private getStorageKey(type: "sessions" | "signers"): string {
    return `${this.smartAccountAddress}_${type}`;
  }

  private toLowercaseAddress(address: string): string {
    return address.toLowerCase();
  }

  async addSessionData(leaf: SessionLeafNode): Promise<void> {
    const data = this.getSessionStore();
    leaf.sessionValidationModule = this.toLowercaseAddress(leaf.sessionValidationModule);
    leaf.sessionPublicKey = this.toLowercaseAddress(leaf.sessionPublicKey);
    data.leafNodes.push(leaf);
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data));
  }

  async getSessionData(param: SessionSearchParam): Promise<SessionLeafNode> {
    this.validateSearchParam(param);

    const sessions = this.getSessionStore().leafNodes;
    const session = sessions.find((s: SessionLeafNode) => {
      if (param.sessionID) {
        return s.sessionID === param.sessionID && (!param.status || s.status === param.status);
      } else if (param.sessionPublicKey && param.sessionValidationModule) {
        return (
          s.sessionPublicKey === this.toLowercaseAddress(param.sessionPublicKey) &&
          s.sessionValidationModule === this.toLowercaseAddress(param.sessionValidationModule) &&
          (!param.status || s.status === param.status)
        );
      } else {
        return undefined;
      }
    });

    if (!session) {
      throw new Error("Session not found.");
    }
    return session;
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
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data));
  }

  async clearPendingSessions(): Promise<void> {
    const data = this.getSessionStore();
    data.leafNodes = data.leafNodes.filter((s: SessionLeafNode) => s.status !== "PENDING");
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data));
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
    localStorage.setItem(this.getStorageKey("signers"), JSON.stringify(signers));
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

  setMerkleRoot(merkleRoot: string): Promise<void> {
    const data = this.getSessionStore();
    data.merkleRoot = merkleRoot;
    localStorage.setItem(this.getStorageKey("sessions"), JSON.stringify(data));
    return Promise.resolve();
  }
}
