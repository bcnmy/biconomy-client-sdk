import { expect } from 'chai'
import {
  updateImplementationEncodedData,
  fallbackHandlerEncodedData
} from '../src/EnodeSmartAccountUtils'

describe('updateImplementationEncodedData', () => {
  it('should encode the updateImplementation function data correctly', async () => {
    const newimplementationAddress = '0x1234567890123456789012345678901234567890'
    const expectedEncodedData =
      '0x025b22bc0000000000000000000000001234567890123456789012345678901234567890'
    const encodedData = await updateImplementationEncodedData(newimplementationAddress)
    expect(encodedData).to.equal(expectedEncodedData)
  })
})

describe('fallbackHandlerEncodedData', () => {
  it('should encode the setFallbackHandler function data correctly', async () => {
    const newhandler = '0x1234567890123456789012345678901234567890'
    const expectedEncodedData =
      '0xf08a03230000000000000000000000001234567890123456789012345678901234567890'
    const encodedData = await fallbackHandlerEncodedData(newhandler)
    expect(encodedData).to.equal(expectedEncodedData)
  })
})
