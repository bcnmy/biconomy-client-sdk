/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: '0.7.6',
  defaultNetwork: 'ganache',
  networks: {
    hardhat: {
      chainId: 31338,
      accounts: {
        mnemonic: 'ripple axis someone ridge uniform wrist prosper there frog rate olympic knee'
      }
    },
    ganache: {
      chainId: 1337,
      url: 'http://localhost:8545',
      accounts: {
        mnemonic: 'direct buyer cliff train rice spirit census refuse glare expire innocent quote',
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20
      }
    }
  }
}
