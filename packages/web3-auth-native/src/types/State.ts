import type { OpenloginUserInfo } from '@toruslabs/openlogin'

interface State {
  privKey?: string
  ed25519PrivKey?: string
  userInfo?: OpenloginUserInfo
  sessionId?: string
}

export type { State }
