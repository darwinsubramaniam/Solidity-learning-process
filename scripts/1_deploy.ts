import { ethers } from "hardhat";
import { WeiHelper } from "./WeiHelper";

// This main function is where the deploy process start
async function main() {
    // how the contract will be deployed to the blockchain
    console.log("Deploying the contract...");
    //1. Fetch contract to deploy
    const Token = await ethers.getContractFactory("Token");
    const Exchange = await ethers.getContractFactory("Exchange");

    const accounts = await ethers.getSigners();
    const deployerAccount = accounts[0];
    const feeAccount = accounts[1];

    console.log("Deployer account: ", deployerAccount.address);
    console.log("Fee account: ", feeAccount.address);

    console.log('\n***********************DEPLOYMENT STARTS*********************************\n');

    //2 . Deploy TOKEN contract
    const dapp = await Token.deploy("Dapp Token", "DAPP", WeiHelper.parse(1_000_000));
    const mETH = await Token.deploy("Mark ETH Token", "mETH", WeiHelper.parse(1_000_000));
    const mDAI = await Token.deploy("Mark DAI Token", "mDAI", WeiHelper.parse(1_000_000));
    await dapp.deployed();
    await mETH.deployed();
    await mDAI.deployed();
    console.log(`DAPP Token contract deployed to: ${dapp.address}`);
    console.log(`mETH Token contract deployed to: ${mETH.address}`);
    console.log(`mDAI Token contract deployed to: ${mDAI.address}`);

    const exchange = await Exchange.deploy(feeAccount.address, 10);
    await exchange.deployed()
    console.log(`Exchange contract deployed to: ${exchange.address}\n\n`);
    console.log('***********************DEPLOYMENT ENDS*********************************');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
