import { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import CONFIG from '../config.json'
import {
  loadAccount,
  loadNetwork,
  loadProvider,
  loadTokens,
  loadExchange
} from '../store/interactions';
import Markets from './Market';
import Navbar from './Navbar';

function App() {

  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // Connect to ethereum provider
    const provider = loadProvider(dispatch);

    // get the current network id
    const chainId = await loadNetwork(provider, dispatch);

    // Reload page if network is  changed
    window.ethereum.on('chainChanged', async () => {
      window.location.reload();
    });

    // Fetch current account and balance when changed
    window.ethereum.on('accountsChanged', async (accounts) => {
      await loadAccount(provider, dispatch);
    })
    // Load tokens
    const DApp = CONFIG[chainId].DApp;
    const mETH = CONFIG[chainId].mETH;
    await loadTokens(provider, [DApp.address, mETH.address], dispatch);

    // Load exchange
    const exchange = CONFIG[chainId].exchange;
    await loadExchange(provider, exchange.address, dispatch);
  }

  useEffect(() => {
    loadBlockchainData();
  });

  return (
    <div>
      <Navbar />
      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets></Markets>

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
