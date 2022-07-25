import { ethers } from "hardhat";
import { expect } from "chai";
import {
  BigNumber,
  Contract,
  ContractReceipt,
  ContractTransaction,
} from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../typechain-types";
import { WeiHelper } from "./Helper/WeiParser";
import { describe } from "mocha";

describe("Exchange", () => {
  let deployer: SignerWithAddress, accounts: SignerWithAddress[];
  let feeAccount: SignerWithAddress;
  let maker: SignerWithAddress;
  let taker: SignerWithAddress;
  let total_token_one_supply: BigNumber;
  let total_token_two_supply: BigNumber;
  let exchange: Contract;

  let token_one: Token;
  let token_two: Token;

  const feePercent = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    maker = accounts[2];
    taker = accounts[3];
    total_token_one_supply = WeiHelper.parse(100_000);
    total_token_two_supply = WeiHelper.parse(100_000);

    const Exchange = await ethers.getContractFactory("Exchange");
    const Token = await ethers.getContractFactory("Token");

    exchange = await Exchange.connect(maker).deploy(
      feeAccount.address,
      feePercent,
    );
    token_one = await Token.connect(maker).deploy(
      "1Token",
      "ONE",
      total_token_one_supply,
    );
    token_two = await Token.connect(taker).deploy(
      "Mock Dai",
      "mDai",
      total_token_two_supply,
    );
  });

  describe("Deployment", () => {
    it("track the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it("track the fee percent", async () => {
      expect(await exchange.feePercent()).to.be.equal(10);
    });
  });

  describe("Depositing Tokens", () => {
    let transaction: ContractTransaction;
    let result: ContractReceipt;
    let ammount = WeiHelper.parse(100);
    beforeEach(async () => {
      // Approve Token
      let approvalTx = await token_one.connect(maker).approve(
        exchange.address,
        ammount,
      );
      await approvalTx.wait();
      // Deposit Token
      transaction = await exchange.connect(maker).depositToken(
        token_one.address,
        ammount,
      );
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("tracks the token deposit", async () => {
        expect(await token_one.balanceOf(exchange.address)).to.equal(ammount);
        expect(await exchange.tokens(token_one.address, maker.address))
          .to.be.equal(ammount);
        expect(await exchange.balanceOf(token_one.address, maker.address))
          .to.be.equal(ammount);
      });
      it("emit Deposit event", () => {
        const event = result.events![1];
        expect(event.event).to.equal("Deposit");
        const args = event.args!;
        expect(args.token).to.equal(token_one.address);
        expect(args.user).to.equal(maker.address);
        expect(args.ammount).to.equal(ammount);
        expect(args.balance).to.equal(ammount);
      });
    });

    describe("Failure", () => {
      it("reverted: token not approved", async () => {
        await expect(
          exchange.connect(maker)
            .depositToken(token_one.address, ammount),
        )
          .to.be.reverted;
      });

      it("should fail if the user approved ammount is let than attempt to transfer", async () => {
        let approvedAmmount = WeiHelper.parse(100);
        let invalidAmmount = WeiHelper.parse(101);
        let approvaltx = await token_one.connect(maker)
          .approve(exchange.address, approvedAmmount);
        await approvaltx.wait();

        await expect(
          exchange.connect(maker).depositToken(
            token_one.address,
            invalidAmmount,
          ),
        ).to.be.rejected;
      });
    });
  });

  describe("Withdraw Tokens", () => {
    let transaction: ContractTransaction;
    let result: ContractReceipt;
    let ammount = WeiHelper.parse(100);
    beforeEach(async () => {
      // Approve Token
      let approvalTx = await token_one.connect(maker).approve(
        exchange.address,
        ammount,
      );
      await approvalTx.wait();
      // Deposit Token
      transaction = await exchange.connect(maker).depositToken(
        token_one.address,
        ammount,
      );
      result = await transaction.wait();

      // Now Withdraw Token
      transaction = await exchange.connect(maker).withdrawToken(
        token_one.address,
        ammount,
      );
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("withdraw token funds", async () => {
        expect(await token_one.balanceOf(exchange.address)).to.equal(0);
        expect(await exchange.tokens(token_one.address, maker.address))
          .to.be.equal(0);
        expect(await exchange.balanceOf(token_one.address, maker.address))
          .to.be.equal(0);
      });
      it("emit Withdraw event", () => {
        const event = result.events![1];
        expect(event.event).to.equal("Withdraw");
        const args = event.args!;
        expect(args.token).to.equal(token_one.address);
        expect(args.user).to.equal(maker.address);
        expect(args.ammount).to.equal(ammount);
        expect(args.balance).to.equal(0);
      });
    });

    describe("Failure", () => {
      it("revert: attempt to withdraw more than deposited", async () => {
        await expect(
          exchange.connect(maker).withdrawToken(token_one.address, ammount),
        ).to.be.reverted;
      });
    });
  });

  describe("Checking Balances", () => {
    let transaction: ContractTransaction;
    let result: ContractReceipt;
    let ammount = WeiHelper.parse(1);
    beforeEach(async () => {
      // Approve Token
      let approvalTx = await token_one.connect(maker).approve(
        exchange.address,
        ammount,
      );
      await approvalTx.wait();
      // Deposit Token
      transaction = await exchange.connect(maker).depositToken(
        token_one.address,
        ammount,
      );
      result = await transaction.wait();
    });

    it("tracks the token deposit", async () => {
      expect(await exchange.balanceOf(token_one.address, maker.address))
        .to.equal(ammount);
    });
  });

  describe("Making Orders", () => {
    let transaction: ContractTransaction, reciept: ContractReceipt;
    let ammount = WeiHelper.parse(100);
    let ammount_to_get = WeiHelper.parse(1);
    let ammount_to_give = WeiHelper.parse(2);
    describe("Success", async () => {
      beforeEach(async () => {
        // Approve
        transaction = await token_one.connect(maker).approve(
          exchange.address,
          ammount,
        );
        reciept = await transaction.wait();
        // Deposit
        transaction = await exchange.connect(maker).depositToken(
          token_one.address,
          ammount,
        );
        reciept = await transaction.wait();
        //make oder
        transaction = await exchange.connect(maker)
          .makeOrder(
            token_two.address,
            ammount_to_get,
            token_one.address,
            ammount_to_give,
          );
        reciept = await transaction.wait();
      });

      it("Tracks the newly created order", async () => {
        let order = await exchange.orders(1);
        let order_count = await exchange.orderCount();

        expect(order_count).to.equal(1);

        expect(order.id).to.equal(1);
        expect(order.ammountGive).to.be.equal(ammount_to_give);
        expect(order.ammountGet).to.be.equal(ammount_to_get);
        expect(order.user).to.be.equal(maker.address);
        expect(order.tokenGet).to.be.equal(token_two.address);
        expect(order.tokenGive).to.be.equal(token_one.address);
      });

      it("Emit order event", () => {
        expect(reciept.events!).is.not.undefined;
        let event = reciept.events![0];
        expect(event.event!).to.equal("Order");

        let args = event.args!;
        expect(args.id).to.equal(1);
        expect(args.user).to.equal(maker.address);
        expect(args.tokenGet).to.equal(token_two.address);
        expect(args.ammountGet).to.equal(ammount_to_get);
        expect(args.ammountGive).to.equal(ammount_to_give);
        expect(args.unix_created_at).to.at.least(1);
      });
    });

    describe("Failure", () => {
      it("REJECTS: with no balance", async () => {
        await expect(
          exchange.connect(maker)
            .makeOrder(
              token_two.address,
              ammount_to_get,
              token_one.address,
              ammount_to_give,
            ),
        ).to.be.revertedWith("insufficient Balance");
      });
    });
  });

  describe("Order Action", () => {
    let transaction: ContractTransaction;
    let reciept: ContractReceipt;
    let ammount_maker_request_token_one = WeiHelper.parse(1);

    beforeEach(async () => {
      // Aprrove -1 
      transaction = await token_one.connect(maker).approve(
        exchange.address,
        ammount_maker_request_token_one,
      );
      reciept = await transaction.wait();
      // deposit -1 
      transaction = await exchange.connect(maker).depositToken(
        token_one.address,
        ammount_maker_request_token_one,
      );
      reciept = await transaction.wait();
      // make an order -1 
      transaction = await exchange.connect(maker).makeOrder(
        token_two.address,
        ammount_maker_request_token_one,
        token_one.address,
        ammount_maker_request_token_one,
      );
      reciept = await transaction.wait();

      // Aprrove -2
      transaction = await token_one.connect(maker).approve(
        exchange.address,
        ammount_maker_request_token_one,
      );
      reciept = await transaction.wait();
      // deposit - 2
      transaction = await exchange.connect(maker).depositToken(
        token_one.address,
        ammount_maker_request_token_one,
      );
      reciept = await transaction.wait();
      // make an order -2 
      transaction = await exchange.connect(maker).makeOrder(
        token_two.address,
        ammount_maker_request_token_one,
        token_one.address,
        ammount_maker_request_token_one,
      );
      reciept = await transaction.wait();
    });

    describe("Cancelling orders", () => {
      describe("Success", async () => {
        beforeEach(async () => {
          transaction = await exchange.connect(maker).cancelOrder(1);
          reciept = await transaction.wait();
        });

        it("Updates cancelled orders", async () => {
          expect(await exchange.orderCancelled(1)).to.be.equal(true);
        });

        it("emit cancellation event", async () => {
          let event = reciept.events![0];
          expect(event.event!).to.equal("CancelOrder");

          const args = event.args!;
          expect(args.id).to.be.equal(1);
          expect(args.user).to.be.equal(maker.address);
          expect(args.tokenGet).to.be.equal(token_two.address);
          expect(args.ammountGet).to.be.equal(ammount_maker_request_token_one);
          expect(args.tokenGive).to.be.equal(token_one.address);
          expect(args.ammountGive).to.be.equal(ammount_maker_request_token_one);
          expect(args.unix_created_at).to.be.at.least(1);
          expect(args.unix_cancelled_at).to.be.at.least(1);
        });
      });

      describe("Failure", () => {
        it("REJECTS: order does not exist", async () => {
          await expect(
            exchange.connect(maker).cancelOrder(999),
          ).to.be.revertedWith("Order does not exist");
        });
        it("REJECTS: unauthorized cancelation", async () => {
          await expect(
            exchange.connect(accounts[5]).cancelOrder(1),
          ).to.be.revertedWith("Invalid caller");
        });
        it("REJECTS: double cancelation", async () => {
          await exchange.connect(maker).cancelOrder(1);
          await expect(
            exchange.connect(maker).cancelOrder(1),
          ).to.be.revertedWith("Order already cancelled");
        });
      });
    });

    describe("Filling orders", () => {
      let amount_deposit_by_taker = WeiHelper.parse(100);
      beforeEach(async () => {
        // Approves
        transaction = await token_two.connect(taker).approve(
          exchange.address,
          amount_deposit_by_taker,
        );
        reciept = await transaction.wait();
        // Deposit
        transaction = await exchange.connect(taker).depositToken(
          token_two.address,
          amount_deposit_by_taker,
        );
        reciept = await transaction.wait();
        // Fill order 
        transaction = await exchange.connect(taker).fillOrder(1);
        reciept = await transaction.wait();
      });
      describe("Success", async () => {
        it("Execute the trade and charge fees", async () => {
          // still have one pending order
          expect(await exchange.balanceOf(token_one.address, maker.address)).to
            .equal(WeiHelper.parse(1));

          expect(await exchange.balanceOf(token_one.address, taker.address)).to
            .equal(WeiHelper.parse(1));

          expect(await exchange.balanceOf(token_two.address, maker.address)).to
            .equal(ammount_maker_request_token_one);

          expect(await exchange.balanceOf(token_two.address, taker.address)).to
            .equal(WeiHelper.parse(98.9));

          expect(
            await exchange.balanceOf(token_two.address, feeAccount.address),
          ).to
            .equal(WeiHelper.parse(0.1));
        });

        it("Only order ID which is filled is marked done", async () => {
          let tx = await token_one.connect(maker).approve(
            exchange.address,
            WeiHelper.parse(1),
          );
          let receipt = await tx.wait();
          tx = await exchange.connect(maker).depositToken(
            token_one.address,
            WeiHelper.parse(1),
          );
          receipt = await tx.wait();
          tx = await exchange.connect(maker).makeOrder(
            token_two.address,
            WeiHelper.parse(1),
            token_one.address,
            WeiHelper.parse(1),
          );
          receipt = await tx.wait();
          expect(await exchange.orderFilled(1)).to.be.equal(true);
          expect(await exchange.orderFilled(2)).to.be.equal(false);
        });

        it("emit fill event", async () => {
          let event = reciept.events![0];
          expect(event.event!).to.equal("Trade");

          const args = event.args!;
          expect(args.id).to.be.equal(1);
          expect(args.maker).to.be.equal(taker.address);
          expect(args.tokenGet).to.be.equal(token_two.address);
          expect(args.ammountGet).to.be.equal(WeiHelper.parse(1));
          expect(args.tokenGive).to.be.equal(token_one.address);
          expect(args.ammountGive).to.be.equal(WeiHelper.parse(1));
          expect(args.creator).to.be.at.equal(maker.address);
          expect(args.timestamp).to.be.at.least(1);
        });
      });

      describe("Failure", () => {
        it("REJECTS: order does not exist", async () => {
          await expect(
            exchange.connect(taker).fillOrder(9999),
          ).to.be.revertedWith("Order does not exist");
        });

        it("REJECTS: order is already filled", async () => {
          await expect(
            exchange.connect(taker).fillOrder(1),
          ).to.be.revertedWith("Order already filled");
        });

        it("REJECTS: order is cancelled", async () => {
          await exchange.connect(maker).cancelOrder(2);
          await expect(
            exchange.connect(taker).fillOrder(2),
          ).to.be.revertedWith("Order already cancelled");
        });
      });
    });
  });
});
