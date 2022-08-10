import { useEffect } from 'react';
import { ethers } from 'ethers';
import {abi as TOKEN_ABI} from '../../artifacts/contracts/Token.sol/Token.json';
import  CONFIG from '../config.json'
import '../App.css';

function App() {

  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log(accounts[0]);

    // Connect Ether to blockchain.
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // Token Smart Contract
    const { chainId } = await provider.getNetwork();
    console.log(chainId);

    const token  = new ethers.Contract(CONFIG[chainId].DApp, TOKEN_ABI ,provider);
    console.log(token.address);
  }

  useEffect(() => {
    loadBlockchainData();
  });

  return (
    <div>
      {/* Navbar */}

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
