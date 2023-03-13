import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import { HardhatUserConfig } from 'hardhat/types'

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: { enabled: true, runs: 800 },
        },
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: { enabled: true, runs: 800 },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  paths: {
    artifacts: 'artifacts',
    sources: 'contracts',
    tests: 'tests'
  }
}

export default config
