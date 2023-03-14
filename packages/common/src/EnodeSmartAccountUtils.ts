import { Contract } from 'ethers'

export async function updateImplementationEncodedData(implementationAddress: string) {
    const implementation = new Contract(implementationAddress, [
      'function updateImplementation(address _implementation)'
    ])
    const encodedData = implementation.interface.encodeFunctionData("updateImplementation", [
      implementationAddress
    ]);
    return encodedData
  }
  
  export async function fallbackHandlerEncodedData(implementationAddress: string, handler: string) {
    const implementation = new Contract(implementationAddress, [
      'function setFallbackHandler(address handler)'
    ])
    const encodedData = implementation.interface.encodeFunctionData("setFallbackHandler", [
      handler
    ]);
    return encodedData
  }