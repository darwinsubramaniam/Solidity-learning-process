import { useSelector, useDispatch } from 'react-redux';
import {loadTokens} from '../store/interactions';

import CONFIG from '../config.json';

const Markets = () => {
    const dispatch = useDispatch();
    const provider = useSelector(state => state.provider.connection);
    const chainId = useSelector(state => state.provider.chainId);

    const marketHandler = async (event) => {
        loadTokens(provider,event.target.value.split(","),dispatch);
    }
    return (
        <div className='component exchange__markets'>
            <div className='component__header'>
                <h2>Select Market</h2>
            </div>
            {
                chainId ? (
                    <select name="markets" id="markets" onChange={marketHandler}>
                    <option value={`${CONFIG[chainId].DApp.address},${CONFIG[chainId].mETH.address}`}>Dapp / mETH</option>
                    <option value={`${CONFIG[chainId].DApp.address},${CONFIG[chainId].mDAI.address}`}>Dapp / mDAI</option>
                </select>
                ):(
                    <div>
                        <p>Please select a network</p>
                    </div>
                )
            }


            <hr />
        </div>
    )
}

export default Markets;