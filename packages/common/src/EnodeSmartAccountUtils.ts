import { ethers } from 'ethers'

export async function updateImplementationEncodedData(newimplementationAddress: string) {
  const impInterface = new ethers.utils.Interface([
    'function updateImplementation(address _implementation)'
  ])
  const encodedData = impInterface.encodeFunctionData('updateImplementation', [
    newimplementationAddress
  ])
  return encodedData
}

export async function fallbackHandlerEncodedData(newhandler: string) {
  const impInterface = new ethers.utils.Interface(['function setFallbackHandler(address handler)'])
  const encodedData = impInterface.encodeFunctionData('setFallbackHandler', [newhandler])
  return encodedData
}
