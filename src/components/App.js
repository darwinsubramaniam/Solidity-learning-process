import { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import CONFIG from '../config.json'
import {
  loadAccount,
  loadNetwork,
  loadProvider,
  loadToken
} from '../store/interactions';

function App() {

  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    await loadAccount(dispatch);
    const provider = loadProvider(dispatch);
    const chainId  = await loadNetwork(provider, dispatch);

    const {token, symbol} = await loadToken(provider, CONFIG[chainId].DApp.address, dispatch);
    console.log(token.address);
    console.log(symbol);
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
