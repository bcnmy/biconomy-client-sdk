import type { UserAuthentication } from './authentication';
import type { KeygenResponse, KeygenSetupOpts, SignResponse, SignSetupOpts } from './networkSigner';
/**
 * The config used to create Wallet Provider Service backend client.
 * implementation for requirements that the backend service must fulfill.
 * @alpha
 */
export type ClientConfig = {
    /**
     * The id of the Wallet Provider Service
     * @alpha
     */
    walletProviderId: string;
    /**
     * The URL used to connect to the service
     * @alpha
     */
    walletProviderUrl: string;
};
export type Signer = (challenge: string) => Promise<UserAuthentication>;
/** Interface for client of  Wallet Provider Service
 * @alpha
 */
export interface IWalletProviderServiceClient {
    getWalletId(): string;
    startKeygen({ setup, signer }: {
        setup: KeygenSetupOpts;
        signer: Signer;
    }): Promise<KeygenResponse>;
    startSigngen({ setup, signer }: {
        setup: SignSetupOpts;
        signer: Signer;
    }): Promise<SignResponse>;
}
//# sourceMappingURL=walletProviderServiceClientInterface.d.ts.map