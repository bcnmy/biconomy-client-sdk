import type { TypedDataDomain } from 'viem';
import type { UserAuthentication } from './authentication';
/** Externally Owned Account (EOA) atuhentication. Uses secret key stored on a wallet to sign requests.
 * The requests are presented to the user in a readable form by using TypedData (EIP712).
 */
import type { KeygenSetupOpts, SignSetupOpts } from './networkSigner';
export type EphClaim = {
    eoa: string;
    ephPK: string;
    expiry: number;
};
export type FieldDefinition = {
    name: string;
    type: string;
};
/** EIP-712 Typed data struct definition.
 * @alpha
 * */
export type TypedData<T> = {
    /** contains the schema definition of the types that are in `msg` */
    types: Record<string, Array<FieldDefinition>>;
    /** is the signature domain separator */
    domain: TypedDataDomain;
    /** points to the type from `types`. It's the root object of `message` */
    primaryType: string;
    /** the request that User is asked to sign */
    message: T;
};
/**
 * Interface to implement communication between this library, and a Browser Wallet. In order to
 * request the signature from the User.
 * @alpha
 */
export interface IBrowserWallet {
    /** Sign data using the secret key stored on Browser Wallet
     * It creates a popup window, presenting the human readable form of `request`
     * @param from - the address used to sign the request
     * @param request - the request to sign by the User in the form of EIP712 typed data.
     * @throws Throws an error if User rejected signature
     * @example The example implementation:
     * ```ts
     * async signTypedData<T>(from: string, request: TypedData<T>): Promise<unknown> {
     *   return await browserWallet.request({
     *     method: 'eth_signTypedData_v4',
     *     params: [from, JSON.stringify(request)],
     *   });
     * }
     * ```
     */
    signTypedData<T>(from: string, request: TypedData<T>): Promise<unknown>;
}
/** Present the request to the User using wallet UI, and ask for sign.
 * The signature is the authorization for the operation
 */
export declare function authenticateUsingEOA({ setup, user_id, challenge, browserWallet, ephPK, lifetime, }: {
    setup: KeygenSetupOpts;
    user_id: string;
    challenge: string;
    browserWallet: IBrowserWallet;
    ephPK: Uint8Array;
    lifetime: number;
}): Promise<UserAuthentication>;
/** Present the request to the User using wallet UI, and ask for sign.
 * The signature is the authorization for the operation
 */
export declare function authenticateUsingEphKey({ setup, user_id, challenge, ephSK, ephPK, }: {
    setup: SignSetupOpts;
    user_id: string;
    challenge: string;
    ephSK: Uint8Array;
    ephPK: Uint8Array;
}): Promise<UserAuthentication>;
//# sourceMappingURL=EOAauthentication.d.ts.map