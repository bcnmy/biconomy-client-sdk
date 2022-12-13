export type DefaultSocialLoginConfig = {
  backendUrl: string
}

export type SocialLoginDTO = {
  chainId: string
  whitelistUrls: { [P in string]: string }
  network: 'mainnet' | 'testnet'
}