import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../typechain-types";

class WeiHelper {
  public static parse(n: number): BigNumber {
    return ethers.utils.parseUnits(n.toString(), "ether");
  }

  public static format(wei: BigNumber): string {
    return ethers.utils.formatEther(wei);
  }
}

describe("Unit Wei Parser Helper", () => {
  it("can convert 1eth to correct wei", () => {
    const expected_result = 1_000_000_000_000_000_000n;
    const result = WeiHelper.parse(1);
    expect(result).to.equal(expected_result);
  });

  it("can convert wei to correct eth", () => {
    const expected_result = "1.0";
    const one_eth_in_wei = ethers.utils.parseUnits("1", "ether");
    const result = WeiHelper.format(one_eth_in_wei);
    expect(result).to.equal(expected_result);
  });
});

describe("Token", () => {
  let token: Token,
    deployer: SignerWithAddress,
    receiver: SignerWithAddress,
    accounts: SignerWithAddress[];

  const name = "UDWorld Token";
  const symbol = "UDW";
  const decimals = 18;
  const totalSupply = 1_000_000;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    // Get the contract instance of the Token contract
    token = await Token.deploy(name, symbol, totalSupply);
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
  });

  describe("Deployment", () => {
    it("has correct name", async () => {
      expect(await token.name()).to.equal(name);
    });

    it("has correct symbol", async () => {
      expect(await token.symbol()).to.equal(symbol);
    });

    it("has correct decimal", async () => {
      expect(await token.decimals()).to.equal(decimals);
    });

    it("has correct total supply of 1Million", async () => {
      const one_million = WeiHelper.parse(1_000_000);
      expect(await token.totalSupply())
        .to
        .equal(one_million);
    });

    it("assign total supply token to deployer ", async () => {
      const one_million = WeiHelper.parse(totalSupply);
      expect(await token.balanceOf(deployer.address))
        .to
        .equal(one_million);
    });
  });

  describe("Sending Token", () => {
    let amount: BigNumber;
    let transaction;
    let result: ContractReceipt;

    describe("Success", () => {
      beforeEach(async () => {
        // Transfer token to account[1] from account[0]
        amount = WeiHelper.parse(100);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait();
      });

      it("Transfer token balances", async () => {
        // Check that the token balance of account[0] is decreased by 100
        // and account[1] is increased by 100
        expect(await token.balanceOf(deployer.address))
          .to
          .equal(WeiHelper.parse(999_900));

        expect(await token.balanceOf(receiver.address))
          .to
          .equal(amount);
      });

      it("Emits a Transfer event", async () => {
        const event = result.events![0];
        expect(event.event).to.equal("Transfer");

        const args = event.args!;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("reverted: insufficent balances", async () => {
        const invalidAmount = WeiHelper.parse(10000000);
        let insufficentBalanceTransaction = async () => {
          await token
            .connect(deployer)
            .transfer(receiver.address, invalidAmount);
        };
        await expect(insufficentBalanceTransaction()).to.be.reverted;
      });

      it("rejects: invalid recipent", async () => {
        await expect(
          token
            .connect(deployer)
            .transfer("0x0", amount),
        ).to.be.rejected;
      });
    });
  });
});