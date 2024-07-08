import type * as viem from 'viem';
import type { NetworkSigner } from './networkSigner';
/**
 * Create a new viem custom account for signing transactions using
 * the MPC network.
 * @param clusterConfig The network cluster configuration.
 * @param keyId The selected Key ID.
 * @param publicKey Associated public key of the selected Key ID.
 * @param threshold The threshold.
 */
export declare function createViemAccount(networkSigner: NetworkSigner, keyId: string, publicKey: string): viem.LocalAccount;
//# sourceMappingURL=viemSigner.d.ts.map