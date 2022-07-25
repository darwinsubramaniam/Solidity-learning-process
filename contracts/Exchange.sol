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
    mapping(uint256 => bool) public orderFilled;
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

    event Trade(
        uint256 id,
        address maker,
        address tokenGet,
        uint256 ammountGet,
        address tokenGive,
        uint256 ammountGive,
        address creator,
        uint256 timestamp
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

        orderCount++;
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

    // ----------------------------
    // Executing Orders

    function fillOrder(uint256 _id) public {
        // 1. Must be valid OrderID
        require(_id > 0 && _id <= orderCount, "Order does not exist");
        // 2. Order can't be filled
        require(!orderFilled[_id], "Order already filled");
        // 3. Order can't be cancelled
        require(!orderCancelled[_id], "Order already cancelled");
        // Fetch order
        _Order storage _order = orders[_id];
        // Execute the trade
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.ammountGet,
            _order.tokenGive,
            _order.ammountGive
        );
    }

    function _trade(
        uint256 _orderId,
        address _maker,
        address _tokenForMaker,
        uint256 _amountGetForMaker,
        address _tokenGiveToTaker,
        uint256 _amountGiveToTaker
    ) internal {
        address _taker = msg.sender;
        // Fee is paid by the user who filled the order (msg.sender)
        // Fee is deducted from _amountGet
        uint256 _feeAmount = (_amountGetForMaker * feePercent) / 100;

        // Do trade here
        // Taker gives requested token to maker
        tokens[_tokenForMaker][_taker] -= (_amountGetForMaker + _feeAmount);
        tokens[_tokenForMaker][_maker] += _amountGetForMaker;

        // maker gives aways give_token to taker
        tokens[_tokenGiveToTaker][_maker] -= _amountGiveToTaker;
        tokens[_tokenGiveToTaker][_taker] += _amountGiveToTaker;

        // Charge Fees
        tokens[_tokenForMaker][feeAccount] += _feeAmount;

        orderFilled[_orderId] = true;

        emit Trade(
            _orderId,
            _taker,
            _tokenForMaker,
            _amountGetForMaker,
            _tokenGiveToTaker,
            _amountGiveToTaker,
            _maker,
            block.timestamp
        );
    }
}
