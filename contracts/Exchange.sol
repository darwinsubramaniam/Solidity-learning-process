// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

// [x] Deposit Token
// [] Withdraw Tokens
// [x] Check Balances
// [] Make Orders
// [] Cancel Orders
// [] Fill Orders
// [] Charge Fees
// [x] Track Fee Account
contract Exchange {
    address public feeAccount;
    uint256 public feePercent;

    // token address => owner address => total deposited
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(address token, address user, uint256 ammount , uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Deposit and withdraw Token
    function depositToken(address _token, uint256 _amount) public {
        // transfer token to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // update user balance
        tokens[_token][msg.sender] += _amount;
        // Emit an event
        emit Deposit(_token,msg.sender,_amount,tokens[_token][msg.sender]);
    }

    // Check balances
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }
}
