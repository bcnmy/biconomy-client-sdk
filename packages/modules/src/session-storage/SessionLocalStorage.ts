import { Hex, createWalletClient, http, toHex } from "viem";
import { SmartAccountSigner, WalletClientSigner } from "@alchemy/aa-core";
import { ISessionStorage, SessionLeafNode, SessionSearchParam, SessionStatus } from "../interfaces/ISessionStorage";
import { mainnet } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SignerData } from "utils/Types";

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
    leaf.sessionValidationModule = this.toLowercaseAddress(leaf.sessionValidationModule) as Hex;
    leaf.sessionPublicKey = this.toLowercaseAddress(leaf.sessionPublicKey) as Hex;
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

  async addSigner(signerData: SignerData): Promise<WalletClientSigner> {
    const signers = this.getSignerStore();
    let signer: SignerData;
    if (!signerData) {
      const pkey = generatePrivateKey()
      signer = {
        pvKey: pkey,
        pbKey: privateKeyToAccount(pkey).publicKey
      };
    } else {
      signer = signerData;
    }
    const accountSigner = privateKeyToAccount(toHex(signer.pvKey));
    const client = createWalletClient({
      account: accountSigner,
      chain: signerData.chainId,
      transport: http(),
    });
    const walletClientSigner: SmartAccountSigner = new WalletClientSigner(
      client,
      "json-rpc" // signerType
    );
    signers[this.toLowercaseAddress(accountSigner.address)] = signerData
    localStorage.setItem(this.getStorageKey("signers"), JSON.stringify(signers));
    return walletClientSigner;
  }

  async getSignerByKey(sessionPublicKey: string): Promise<WalletClientSigner> {
    const signers = this.getSignerStore();
    const signerData = signers[this.toLowercaseAddress(sessionPublicKey)];
    if (!signerData) {
      throw new Error("Signer not found.");
    }
    const account = privateKeyToAccount(signerData.privateKey);
    const client = createWalletClient({
      account,
      chain: mainnet,
      transport: http(),
    });
    const signer = new WalletClientSigner(client, "viem");
    return signer;
  }

  async getSignerBySession(param: SessionSearchParam): Promise<WalletClientSigner> {
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
