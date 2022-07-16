import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const parseToProperDecimalPower = (n: any): BigNumber => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Token", () => {
  let token: any;
  let deployer: SignerWithAddress;
  let accounts: SignerWithAddress[]

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
      const one_million = parseToProperDecimalPower(1_000_000);
      expect(await token.totalSupply())
        .to
        .equal(one_million);
    });

    it("assign total supply token to deployer ", async () => {
      const one_million = parseToProperDecimalPower(totalSupply);
      expect(await token.balanceOf(deployer.address))
        .to
        .equal(one_million);
    });
  });
});
