import SmartAccount from '@biconomy-sdk/smart-account'; // 


export function main() {
  enum ChainId {
    // Ethereum
    MAINNET = 1,
    ROPSTEN = 3,
    RINKEBY = 4,
    GOERLI = 5,
    KOVAN = 42
  }

const wallet = new SmartAccount({
    owner: '0x4281d6888D7a3A6736B0F596823810ffBd7D4808',
    activeNetworkId: ChainId.MAINNET,
    supportedNetworksIds: [ChainId.MAINNET, ChainId.RINKEBY],
    backend_url: "http://localhost:3000/v1"
  })

  wallet.ethersAdapter(ChainId.RINKEBY).getTransaction('0x3dbc9da5b081a93658d4bf2f85bce2e74332b1806b287248b318c6da13c27994')
  .then(res=>{
    console.log('Tx Details are ', res);
  })

  wallet.ethersAdapter(ChainId.MAINNET).getBalance('0x4281d6888D7a3A6736B0F596823810ffBd7D4808')
  .then(res=>{
    console.log('Balance is ', res);
  })
}

main();


  /*wallet.ethersAdapter(ChainId.RINKEBY).getOwner()
  .then(res=>{
    console.log('Chain id is ', res);
  })*/