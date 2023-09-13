export interface IBiconomyProvider {
  // TODO: fill in the rest of the interface
  // request(args: { method: string; params?: any[] }): Promise<any>
  getAddress(): Promise<string>;
  signMessage(): Promise<string>;
}
