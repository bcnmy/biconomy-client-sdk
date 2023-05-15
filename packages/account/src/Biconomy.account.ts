import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import {  Signer, ethers } from 'ethers'
import { Account } from 'Account.Base'
import {
    EntryPoint_v100__factory,
    SmartAccountFactory_v100,
    SmartAccountFactory_v100__factory,
    SmartAccount_v100__factory,
} from '@biconomy/common'
export class BiconomyAccount extends Account {
    private factory: SmartAccountFactory_v100
    private signer: Signer

    constructor(readonly signerOrProvider: Web3Provider, readonly rpcUrl: string, readonly epAddress: string, readonly factoryAddress: string) {
        super()
        this.provider = new JsonRpcProvider(rpcUrl);
        this.entryPoint = EntryPoint_v100__factory.connect(epAddress, this.provider);
        this.factory = SmartAccountFactory_v100__factory.connect(
            factoryAddress,
            this.provider
        );
        this.signer = this.signerOrProvider.getSigner()
    }
    async init(){
        const instance = new BiconomyAccount(
            this.signerOrProvider,
            this.rpcUrl,
            this.epAddress,
            this.factoryAddress
          );
          try {
            instance.setInitCode(await ethers.utils.hexConcat([
              instance.factory.address,
              instance.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
                await instance.signerOrProvider.getSigner().getAddress(),
                ethers.BigNumber.from(0),
              ]),
            ])
            )
            await instance.entryPoint.callStatic.getSenderAddress(instance.getInitCode());
      
            throw new Error("getSenderAddress: unexpected result");
          } catch (error: any) {
            const addr = await instance.factory.getAddressForCounterFactualAccount(await instance.signer.getAddress(), ethers.BigNumber.from(0))
            instance.setProxy(await SmartAccount_v100__factory.connect(addr, instance.provider));
          }
    }
    // encodeExecuteCall(target: string, value: BigNumberish, data: BytesLike): Promise<string> {
    //     return '0x'
    // }
    // encodeExecuteBatchCall(target: string[], value: BigNumberish[], data: BytesLike[]): Promise<string> {
    //     return '0x'
    // }
}