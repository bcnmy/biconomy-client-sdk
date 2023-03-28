import { expect } from 'chai'
import { getWalletInfo, deployCounterFactualEncodedData } from '../src/WalletFactoryApi'

const txServiceUrl = 'https://sdk-backend.staging.biconomy.io/v1'

describe('WalletFactoryAPI', () => {
  it('get smart account wallet info', async () => {
    const initializerDto = {
      chainId: 5,
      owner: '0x1234567890123456789012345678901234567890',
      txServiceUrl
    }
    const smartAccount = await getWalletInfo(initializerDto)
    expect(smartAccount.isDeployed).to.be.equal(false)
    expect(smartAccount.eoaAddress).to.be.equal(initializerDto.owner)
  })

  it('gives error if owner is wrong', async () => {
    const initializerDto = {
      chainId: 5,
      owner: '0x123456789012345678901234567890123456789',
      txServiceUrl
    }
    try {
      await getWalletInfo(initializerDto)
    } catch (e: any) {
      expect(e.message).to.be.equal('Please Supply Valid Address')
    }
  })

  describe('deployCounterFactualEncodedData', () => {
    it('should encode the correct data', async () => {
      const randIndex = Math.floor(Math.random() * 1000)
      const initializerDto = {
        chainId: 5,
        owner: '0x1234567890123456789012345678901234567890',
        txServiceUrl,
        index: randIndex
      }
      const encodedData = await deployCounterFactualEncodedData(initializerDto)
      expect(encodedData).to.equal(
        '0x' +
          '088924ef000000000000000000000000' + // function signature
          '1234567890123456789012345678901234567890' + // owner address
          randIndex.toString(16).padStart(64, '0') // index in hex
      )
    })
  })
})
