/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import transakSDK from '@transak/transak-sdk'
import { ITransakDto, environments } from 'interface'

class TransakSDK {
  apiKey: string
  transak: any

  constructor(environment: environments, transakData: ITransakDto = {}) {
    this.apiKey = '486be068-bb98-4852-8947-c415e12200a9'
    const transak = new transakSDK({
      apiKey: this.apiKey,
      widgetHeight: '625px',
      widgetWidth: '500px',
      environment: environment,
      ...transakData
    })
    this.transak = transak
  }

  init() {
    try {
      this.transak.init()
    } catch (err: any) {
      console.error(err)
      throw new Error('Error while init transakSDK')
    }
  }

  getTransak() {
    return this.transak
  }
}

export default TransakSDK
