import type { IBrowserWallet } from './EOAauthentication';
import type { KeygenSetupOpts, SignSetupOpts } from './networkSigner';
/** Type of the request authentication
 * @alpha
 */
export declare enum AuthMethod {
    /** Authentication using Externally Owned Account */
    EOA = 0,
    /** No authentication */
    NONE = 1
}
export type UserCredentials = {
    id: string;
    method: string;
    credentials: string;
};
export type UserAuthentication = {
    credentials: UserCredentials;
    signature: string;
};
export interface AuthModule {
    authenticate({ setup, challenge, }: {
        setup: KeygenSetupOpts | SignSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
/** The `AuthModule` implementing Externally Owned Account authentication.
 * @alpha
 */
export declare class EOAAuth implements AuthModule {
    /** User ID, typically the ETH address that is used to do authentication */
    userId: string;
    /** An interface to the wallet, like MetaMask, that is used to sign the requests */
    browserWallet: IBrowserWallet;
    /** Public key of the ephemeral key */
    ephPK: Uint8Array;
    /** Lifetime of the ephemeral key */
    lifetime: number;
    constructor(userId: string, browserWallet: IBrowserWallet, ephPK: Uint8Array, lifetime?: number);
    /**
     * Prepares a message to present on the Browser Wallet window and requests to sign it.
     * @param setup - either Keygen or Sign setup options
     * @param challenge - the challenge received from the backend
     *
     * @public
     */
    authenticate({ setup, challenge, }: {
        setup: KeygenSetupOpts | SignSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
/** An Ephmeral key used to locally sign the signature requests to network.
 * This eph key is registered during keygen. The key is used to sign the requests without
 * asking the user to sign the request each time.
 * The auth module is only used for signing requests to the network.
 * */
export declare class EphAuth implements AuthModule {
    /** User ID, typically the ETH address that is used to do authentication */
    userId: string;
    /** Secret key of the ephemeral keypair */
    ephSK: Uint8Array;
    /** Public key of the ephemeral keypair */
    ephPK: Uint8Array;
    constructor(userId: string, ephSK: Uint8Array);
    authenticate({ setup, challenge, }: {
        setup: KeygenSetupOpts | SignSetupOpts;
        challenge: string;
    }): Promise<UserAuthentication>;
}
//# sourceMappingURL=authentication.d.ts.map