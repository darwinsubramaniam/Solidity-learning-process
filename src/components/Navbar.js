import { useSelector, useDispatch } from 'react-redux';
import Blockies from 'react-blockies';
import { loadAccount } from '../store/interactions';
import LOGO from '../assets/logo.png';
import ETH_LOGO from '../assets/eth.svg';
import CONFIG from '../config.json';

const Navbar = () => {
    const dispatch = useDispatch();
    const provider = useSelector(state => state.provider.connection);
    const chainId = useSelector(state => state.provider.chainId);
    const account = useSelector(state => state.provider.account);
    const balance = Number(useSelector(state => state.provider.balance));
    const connectHandler = async () => {
        // Load account and balance
        await loadAccount(provider, dispatch);
    };
    const networkHandler = async (event) => {
        console.log(event.target.value);
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{
                chainId: event.target.value,
            }],
        })
    }
    return (
        <div className='exchange__header grid'>
            <div className='exchange__header--brand flex'>
                <img src={LOGO} className="logo" alt='Dapp Logo'></img>
                <h1>DApp Token Excange</h1>
            </div>

            <div className='exchange__header--networks flex'>
                <img src={ETH_LOGO} className="logo" alt="ETH logo"></img>
                {
                    chainId && (
                        <select name="networks" id="networks" value={CONFIG[chainId] ? `0X${chainId.toString(16)}` : '0'} onChange={networkHandler}>
                            <option value="0" disabled>Select Network</option>
                            <option value="0x7A69">Localhost</option>
                            <option value="0X2a">Kovan</option>
                        </select>
                    )
                }

            </div>

            <div className='exchange__header--account flex'>
                {
                    balance ?
                        (
                            <p><small>My Balance</small>{balance.toFixed(4)} ETH</p>
                        )
                        :
                        (
                            <p><small>My Balance</small>0 ETH</p>
                        )
                }

                {
                    account ?
                        (
                            <a href={CONFIG[chainId] ? `${CONFIG[chainId].explorerURL}/address/${account}` : '#'}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {`${account.slice(0, 6)}...${account.slice(38, 42)}`}

                                <Blockies
                                    seed={account}
                                    size={10}
                                    scale={3}
                                    color="#2187D0"
                                    bgColor='#F1F2F9'
                                    spotColor='#767F92'
                                    className='identicon'
                                />

                            </a>
                        )
                        :
                        (
                            <button className='button' onClick={connectHandler}>Connect</button>
                        )
                }

            </div>
        </div>
    )
}

export default Navbar;

