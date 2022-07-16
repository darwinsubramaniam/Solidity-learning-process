import { ethers } from "hardhat";

// This main function is where the deploy process start
async function main() {
    // how the contract will be deployed to the blockchain
    
    //1. Fetch contract to deploy
    const Token = await ethers.getContractFactory("Token");
    
    //2 . Deploy contract
    const token = await Token.deploy();

    await token.deployed();
    //3. Log the address of the contract
    console.log(`Token contract deployed to: ${token.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
