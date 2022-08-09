import { ethers } from "hardhat";
import { BigNumber } from "ethers";


export class WeiHelper {
  public static parse(n: number): BigNumber {
    return ethers.utils.parseUnits(n.toString(), "ether");
  }

  public static format(wei: BigNumber): string {
    return ethers.utils.formatEther(wei);
  }
}
