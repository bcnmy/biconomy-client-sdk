export interface IBiconomyProvider {
  request(args: { method: string; params?: any[] }): Promise<any>
  getAddress(): Promise<string>
  signMessage(msg: string | Uint8Array): Promise<string>
}
