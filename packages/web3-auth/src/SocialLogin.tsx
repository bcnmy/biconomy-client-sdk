import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { ethers } from 'ethers'
import { Web3AuthCore } from '@web3auth/core'
import { WALLET_ADAPTERS, CHAIN_NAMESPACES, SafeEventEmitterProvider } from '@web3auth/base'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'

import UIComponent from './UI'

function createLoginModal(socialLogin: SocialLogin) {
  const domElement = (document as any).getElementById('web3auth-container')
  if (domElement) {
    hydrateRoot(domElement, <UIComponent socialLogin={socialLogin} />)
  } else {
    const root = createRoot(domElement)
    root.render(<UIComponent socialLogin={socialLogin} />)
  }
}

class SocialLogin {
  walletDiv: any
  walletIframe: any
  iWin: any = false
  iframeInitialized = false
  isInit = false
  web3auth: Web3AuthCore | null = null
  provider: SafeEventEmitterProvider | null = null

  constructor() {
    this.createWalletDiv()
    this.isInit = false
    this.web3auth = null
    this.provider = null
  }

  async init(chainId: string) {
    try {
      console.log('init')
      const web3AuthCore = new Web3AuthCore({
        clientId:
          'BEQgHQ6oRgaJXc3uMnGIr-AY-FLTwRinuq8xfgnInrnDrQZYXxDO0e53osvXzBXC1dcUTyD2Itf-zN1VEB8xZlo',
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: chainId
        }
      })
      console.log('web3AuthCore 1', web3AuthCore)

      const openloginAdapter = new OpenloginAdapter({
        adapterSettings: {
          clientId:
            'BEQgHQ6oRgaJXc3uMnGIr-AY-FLTwRinuq8xfgnInrnDrQZYXxDO0e53osvXzBXC1dcUTyD2Itf-zN1VEB8xZlo',
          network: 'testnet',
          uxMode: 'redirect',
          loginConfig: {
            google: {
              name: 'Biconomy Social Login',
              verifier: 'bico-google-test',
              typeOfLogin: 'google',
              clientId: '232763728538-7o7jmud0gkfojmijb603cu37konbbn96.apps.googleusercontent.com'
            }
          },
          whiteLabel: {
            name: 'Biconomy SDK',
            logoLight: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9543.png',
            logoDark: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9543.png',
            defaultLanguage: 'en',
            dark: true
          }
        }
      })
      web3AuthCore.configureAdapter(openloginAdapter)
      console.log('web3AuthCore 2', web3AuthCore)
      await web3AuthCore.init()
      console.log('web3AuthCore 3', web3AuthCore)
      this.web3auth = web3AuthCore
      if (web3AuthCore && web3AuthCore.provider) {
        this.provider = web3AuthCore.provider
      }
      this.isInit = true
    } catch (error) {
      console.error(error)
    }
  }

  _createIframe(iframeContainerDiv: any) {
    this.walletIframe = document.createElement('iframe')
    this.walletIframe.style.display = 'none'
    this.walletIframe.style.display = 'relative'
    this.walletIframe.onload = () => {
      this.iWin = this.walletIframe.contentWindow || this.walletIframe
      this.iframeInitialized = true
    }
    iframeContainerDiv.appendChild(this.walletIframe)
  }

  createWalletDiv() {
    //create a fixed div into html but keep it hidden initially
    const walletDiv = document.createElement('div')
    walletDiv.id = 'web3auth-container'
    walletDiv.style.display = 'none'
    walletDiv.style.position = 'fixed'
    walletDiv.style.top = '0'
    walletDiv.style.right = '0'
    walletDiv.style.zIndex = '2323123'
    this.walletDiv = walletDiv
    // insert div into top of body.
    document.body.insertBefore(walletDiv, document.body.firstChild)
    this.walletDiv.innerHTML =
      "<img src='https://live-nft-hosted-assets.s3.ap-south-1.amazonaws.com/cancel_icon.svg' style='position:absolute;left: -20px;background: black;padding: 3px;border-radius:50%' onclick='window.socialLoginSDK.hideWallet()'/>"
    this._createIframe(walletDiv)
  }

  showWallet() {
    this.walletDiv.style.display = 'block'
    this.walletIframe.style.display = 'block'
    // Set height and width of the iframe to 600x341
    this.walletIframe.style.height = '600px'
    this.walletIframe.style.width = '341px'
    this.walletIframe.style.border = '0px'
    this.walletIframe.style.borderRadius = '3%'
    const el = document.getElementById('web3auth-container')
    el?.dispatchEvent(new Event('show-modal'))
  }

  hideWallet() {
    console.log('hide wallet')
    this.walletDiv.style.display = 'none'
    this.walletIframe.style.display = 'none'
  }

  showConnectModal() {
    createLoginModal(this)
  }

  async login() {
    console.log('this', this)
    console.log('this.web3auth', this.web3auth)
    if (!this.web3auth) {
      console.log('web3auth not initialized yet')
      return
    }
    try {
      const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
        loginProvider: 'google'
      })
      const web3Provider = new ethers.providers.Web3Provider(web3authProvider!)
      const signer = web3Provider.getSigner()
      const gotAccount = await signer.getAddress()
      const network = await web3Provider.getNetwork()
      console.info(`EOA Address ${gotAccount}\nNetwork: ${network}`)
      return web3authProvider
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  logout() {
    if (!this.web3auth) {
      console.log('web3auth not initialized yet')
      return
    }
    this.web3auth.logout().then(() => {
      this.provider = null
    })
  }
}

const socialLoginSDK = new SocialLogin()
;(window as any).socialLoginSDK = socialLoginSDK
export { socialLoginSDK }

export default SocialLogin
