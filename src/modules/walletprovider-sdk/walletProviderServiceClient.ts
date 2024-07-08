import type { KeygenResponse, KeygenSetupOpts, SignResponse, SignSetupOpts } from './networkSigner';
import type { ClientConfig, IWalletProviderServiceClient, Signer } from './walletProviderServiceClientInterface';
/**
 * The Websocket client to the Wallet Provider backend service.
 * All requests are relayed by this entity to the MPC network.
 * @alpha
 */
export declare class WalletProviderServiceClient implements IWalletProviderServiceClient {
    walletProviderId: string;
    walletProviderUrl: string;
    /**
     * Create new client that connects to the backend service
     * @param config - config containing information about backend service
     */
    constructor(config: ClientConfig);
    getWalletId(): string;
    startKeygen({ setup, signer }: {
        setup: KeygenSetupOpts;
        signer: Signer;
    }): Promise<KeygenResponse>;
    startSigngen({ setup, signer }: {
        setup: SignSetupOpts;
        signer: Signer;
    }): Promise<SignResponse>;
    connect(params: KeygenSetupOpts | SignSetupOpts, signer: Signer): Promise<string>;
}
//# sourceMappingURL=walletProviderServiceClient.d.ts.map