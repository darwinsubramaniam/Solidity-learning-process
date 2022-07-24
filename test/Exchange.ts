import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractReceipt, ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../typechain-types";
import { WeiHelper } from "./Helper/WeiParser";

describe("Exchange", () => {
  let deployer: SignerWithAddress,
    accounts: SignerWithAddress[],
    feeAccount: SignerWithAddress,
    exchange: Contract;

  let token_one: Token,
    token_two: Token;
  let myWallet: SignerWithAddress,
    otherPersonWallet: SignerWithAddress;

  const feePercent = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    myWallet = accounts[2];
    otherPersonWallet = accounts[3];

    const Exchange = await ethers.getContractFactory("Exchange");
    const Token = await ethers.getContractFactory("Token");

    exchange = await Exchange.connect(myWallet).deploy(
      feeAccount.address,
      feePercent,
    );
    token_one = await Token.connect(myWallet).deploy(
      "1Token",
      "ONE",
      WeiHelper.parse(100_000),
    );
  });

  describe("Deployment", () => {
    it("track the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it("track the fee percent", async () => {
      expect(await exchange.feePercent()).to.be.equal(10);
    });

    it("able to withdraw correct ammount", async () => {
    });

    it("able to check balance", async () => {
    });

    it("able to place order", async () => {
    });

    it("able to cancel correct order", async () => {
    });

    it("able to fill in order, when matched", async () => {
    });

    it("when order filled , charge are place", async () => {
    });
  });

  describe("Depositing Tokens", () => {
    let transaction: ContractTransaction;
    let result: ContractReceipt;
    let ammount = WeiHelper.parse(100);
    beforeEach(async () => {
      // Approve Token
      let approvalTx = await token_one.connect(myWallet).approve(
        exchange.address,
        ammount,
      );
      await approvalTx.wait();
      // Deposit Token
      transaction = await exchange.connect(myWallet).depositToken(
        token_one.address,
        ammount,
      );
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("tracks the token deposit", async () => {
        expect(await token_one.balanceOf(exchange.address)).to.equal(ammount);
        expect(await exchange.tokens(token_one.address, myWallet.address)).to.be
          .equal(ammount);
        expect(await exchange.balanceOf(token_one.address, myWallet.address)).to
          .be.equal(ammount);
      });
      it("emit Deposit event", () => {
        const event = result.events![1];
        expect(event.event).to.equal("Deposit");
        const args = event.args!;
        expect(args.token).to.equal(token_one.address);
        expect(args.user).to.equal(myWallet.address);
        expect(args.ammount).to.equal(ammount);
        expect(args.balance).to.equal(ammount);
      });
    });

    describe("Failure", () => {
      it("reverted: token not approved", async () => {
        await expect(
          exchange.connect(myWallet)
            .depositToken(token_one.address, ammount),
        )
          .to.be.reverted;
      });

      it("should fail if the user approved ammount is let than attempt to transfer", async () => {
        let approvedAmmount = WeiHelper.parse(100);
        let invalidAmmount = WeiHelper.parse(101);
        let approvaltx = await token_one.connect(myWallet)
          .approve(exchange.address, approvedAmmount);
        await approvaltx.wait();

        await expect(
          exchange.connect(myWallet).depositToken(
            token_one.address,
            invalidAmmount,
          ),
        ).to.be.rejected;
      });
    });
  });
});
