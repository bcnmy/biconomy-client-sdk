import React from 'react'
import { createRoot } from 'react-dom/client'
import { ethers } from 'ethers'
import { Web3AuthCore } from '@web3auth/core'
import { WALLET_ADAPTERS, CHAIN_NAMESPACES, SafeEventEmitterProvider } from '@web3auth/base'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'

import UIComponent from './UI'

function createLoginModal(socialLogin: SocialLogin) {
  const root = createRoot((document as any).getElementById('web3auth-container'))
  root.render(<UIComponent socialLogin={socialLogin} />)
}

class SocialLogin {
  walletDiv: any
  walletIframe: any
  iWin: any = false
  iframeInitialized = false
  isInit = false
  clientId: string
  web3auth: Web3AuthCore | null = null
  provider: SafeEventEmitterProvider | null = null

  constructor() {
    this.createWalletDiv()
    this.isInit = false
    this.web3auth = null
    this.provider = null
    this.clientId =
      'BEQgHQ6oRgaJXc3uMnGIr-AY-FLTwRinuq8xfgnInrnDrQZYXxDO0e53osvXzBXC1dcUTyD2Itf-zN1VEB8xZlo'
  }

  async init(chainId: string) {
    try {
      console.log('SocialLogin init')
      const web3AuthCore = new Web3AuthCore({
        clientId: this.clientId,
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: chainId
        }
      })

      const openloginAdapter = new OpenloginAdapter({
        adapterSettings: {
          clientId: this.clientId,
          network: 'testnet',
          uxMode: 'redirect',
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
      await web3AuthCore.init()
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
    // create a fixed div into html but keep it hidden initially
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

export default SocialLogin
