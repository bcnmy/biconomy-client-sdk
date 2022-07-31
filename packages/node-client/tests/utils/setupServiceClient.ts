import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { EthAdapter } from '@gnosis.pm/safe-core-sdk-types'
import SDKBackendClient from '../../src'
import config from './config'
import { getEthAdapter } from './setupEthAdapter'

interface ServiceClientConfig {
  serviceSdk: SDKBackendClient
  ethAdapter: EthAdapter
  signer: Wallet
}

export async function getServiceClient(signerPk: string): Promise<ServiceClientConfig> {
  const provider = getDefaultProvider(config.JSON_RPC)
  const signer = new Wallet(signerPk, provider)
  const ethAdapter = await getEthAdapter(signer)
  const serviceSdk = new SDKBackendClient({ txServiceUrl: config.BASE_URL /*,ethAdapter*/ })
  return { serviceSdk, ethAdapter, signer }
}
