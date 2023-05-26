import { Web3Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'
export type SmartAccountConfig = {
    epAddress: string,
    bundlerUrl?: string
}
export type BiconomySmartAccountConfig = {
    signerOrProvider?: Web3Provider | Signer,
    rpcUrl: string,
    epAddress: string,
    factoryAddress: string,
    bundlerUrl?: string,
    paymasterUrl?: string,
    nodeClientUrl?: string
}