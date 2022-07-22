import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../typechain-types";
import { WeiHelper } from "./Helper/WeiParser";

describe("Exchange", () => {
  let deployer: SignerWithAddress,
    accounts: SignerWithAddress[],
    feeAccount: SignerWithAddress,
    exhange: any;

    const feePercent = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];

    const Exchange = await ethers.getContractFactory('Exchange');
    exhange = await Exchange.deploy(feeAccount.address, feePercent);
  });

  describe("Deployment", () => {
    it("track the fee account", async () => {
        expect(await exhange.feeAccount()).to.equal(feeAccount.address);
    });

    it("track the fee percent", async () => {
        expect(await exhange.feePercent()).to.be.equal(10);
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
});
