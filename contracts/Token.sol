// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // Track the balances
    mapping (address => uint256) public balanceOf;
    // Send Tokens

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10 ** decimals);
        // Give the owner all the tokens
        balanceOf[msg.sender] = totalSupply;
    }

}
