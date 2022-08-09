import { ethers } from "hardhat";
import { expect } from "chai";
import { WeiHelper } from "../../scripts/WeiHelper";

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
