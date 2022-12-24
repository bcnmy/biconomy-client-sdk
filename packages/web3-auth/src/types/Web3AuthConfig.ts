export type DefaultSocialLoginConfig = {
  backendUrl: string
}

export type WhiteLabelDataType = {
  name: string
  logo: string
}

export type SocialLoginDTO = {
  chainId: string
  whitelistUrls: { [P in string]: string }
  network: 'mainnet' | 'testnet'
  whteLableData: WhiteLabelDataType
}
