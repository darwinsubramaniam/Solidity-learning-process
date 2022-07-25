// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

// [x] Deposit Token
// [x] Withdraw Tokens
// [x] Check Balances
// [x] Make Orders
// [x] Cancel Orders
// [] Fill Orders
// [] Charge Fees
// [x] Track Fee Account
contract Exchange {
    struct _Order {
        uint256 id; // ID of the order
        address user; // user who made the order
        address tokenGet;
        uint256 ammountGet;
        address tokenGive;
        uint256 ammountGive;
        uint256 unix_created_at;
    }

    address public feeAccount;
    uint256 public feePercent;

    // token address => owner address => total deposited
    mapping(address => mapping(address => uint256)) public tokens;

    // Orders Mapping id their orders Key = ID of Order
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    uint256 public orderCount;

    event Deposit(
        address token,
        address user,
        uint256 ammount,
        uint256 balance
    );
    event Withdraw(
        address token,
        address user,
        uint256 ammount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 ammountGet,
        address tokenGive,
        uint256 ammountGive,
        uint256 unix_created_at
    );

    event CancelOrder(
        uint256 id,
        address user,
        address tokenGet,
        uint256 ammountGet,
        address tokenGive,
        uint256 ammountGive,
        uint256 unix_created_at,
        uint256 unix_cancelled_at
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function depositToken(address _token, uint256 _amount) public {
        // transfer token to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // update user balance
        tokens[_token][msg.sender] += _amount;
        // Emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _ammount) public {
        require(tokens[_token][msg.sender] >= _ammount);

        // Transfer token to user
        Token(_token).transfer(msg.sender, _ammount);
        // Update user balance
        tokens[_token][msg.sender] -= _ammount;
        // Emit an event
        emit Withdraw(_token, msg.sender, _ammount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _ammountGet,
        address _tokenGive,
        uint256 _ammountGive
    ) public {
        // Prevent orders if tokens aren't on exchange.
        require(
            balanceOf(_tokenGive, msg.sender) >= _ammountGive,
            "insufficient Balance"
        );

        orderCount += 1;
        orders[orderCount] = _Order(
            orderCount, // ID
            msg.sender, // user
            _tokenGet,
            _ammountGet,
            _tokenGive,
            _ammountGive,
            block.timestamp // timestamp
        );

        // Emit Event
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _ammountGet,
            _tokenGive,
            _ammountGive,
            block.timestamp
        );
    }

    function cancelOrder(uint256 _id) public {
        // order not cancelled yet
        require(!orderCancelled[_id], "Order already cancelled");       

        _Order storage _order = orders[_id];
        
        // order exist
        require(_order.id == _id, "Order does not exist");
        // order belong to the caller
        require(orders[_id].user == msg.sender, "Invalid caller");

        orderCancelled[_id] = true;

        emit CancelOrder(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.ammountGet,
            _order.tokenGive,
            _order.ammountGive,
            _order.unix_created_at,
            block.timestamp
        );
    }
}
