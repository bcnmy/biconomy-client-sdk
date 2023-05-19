import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { Signer, ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { Account } from './SmartAccount'
import { BiconomyPaymasterAPI } from '@biconomy/paymaster-service'
import {
  EntryPoint_v100__factory,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100__factory,
} from '@biconomy/common'
export class BiconomyAccount extends Account {
  private factory: SmartAccountFactory_v100

  constructor(readonly signerOrProvider: Web3Provider, readonly rpcUrl: string, readonly epAddress: string, readonly factoryAddress: string, readonly bundlerUrl?: string, readonly paymasterUrl?: string) {
    super(epAddress, bundlerUrl)
    this.provider = new JsonRpcProvider(rpcUrl);
    this.entryPoint = EntryPoint_v100__factory.connect(epAddress, this.provider);
    this.factory = SmartAccountFactory_v100__factory.connect(
      factoryAddress,
      this.provider
    );
    this.signer = this.signerOrProvider.getSigner()
    console.log(paymasterUrl);
    if (paymasterUrl)
      this.paymaster = new BiconomyPaymasterAPI(paymasterUrl)
  }
  /**
   * @description This function will initialise BiconomyAccount class state
   * @returns Promise<BiconomyAccount>
   */
  async init(): Promise<BiconomyAccount> {
    const instance = new BiconomyAccount(
      this.signerOrProvider,
      this.rpcUrl,
      this.epAddress,
      this.factoryAddress,
      this.bundlerUrl,
      this.paymasterUrl
    );
    try {
      instance.chainId = await this.provider.getNetwork().then((net) => net.chainId)
      instance.initCode = await ethers.utils.hexConcat([
        instance.factory.address,
        instance.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
          await instance.signerOrProvider.getSigner().getAddress(),
          ethers.BigNumber.from(0),
        ]),
      ])
      await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);

      throw new Error("getSenderAddress: unexpected result");
    } catch (error: any) {
      const addr = await instance.factory.getAddressForCounterFactualAccount(await instance.signer.getAddress(), ethers.BigNumber.from(0))
      instance.proxy = await SmartAccount_v100__factory.connect(addr, instance.provider);
      instance.initCode = '0x'
    }
    console.log(instance.userOp);
    console.log(instance.proxy.address);

    instance.useDefaults({
      sender: instance.proxy.address
    })
    return instance
  }
  /**
   * @description an overrided function to showcase overriding example
   * @returns 
   */
  nonce(): Promise<BigNumber> {
    console.log('Overiding example');
    return this.proxy.nonce()
  }
  /**
   * 
   * @param to { target } address of transaction 
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns 
   */
  execute(to: string, value: BigNumberish, data: BytesLike) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeCall", [to, value, data])
    );
  }
  /**
   * 
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns 
   */
  executeBatch(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeBatchCall", [to, value, data])
    );
  }
}