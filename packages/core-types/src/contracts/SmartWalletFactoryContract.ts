
export interface SmartWalletFacoryContract {
    deployCounterFactualWallet(owner:string, entryPointL:string, handler:string, index:number): Promise<string>
    deployWallet(owner:string, entryPointL:string, handler:string): Promise<string>
    getAddressForCounterfactualWallet(owner:string, index:number): Promise<string>
  }
  