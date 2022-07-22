import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

export class WeiHelper {
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
