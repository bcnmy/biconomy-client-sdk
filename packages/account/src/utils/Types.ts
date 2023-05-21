import { Web3Provider } from '@ethersproject/providers'

export type SmartAccountConfig = {
    epAddress: string,
    bundlerUrl?: string
}
export type BiconomySmartAccountConfig = {
    signerOrProvider: Web3Provider,
    rpcUrl: string,
    epAddress: string,
    factoryAddress: string,
    bundlerUrl?: string,
    paymasterUrl?: string
}