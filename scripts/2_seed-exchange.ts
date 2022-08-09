import { ContractReceipt, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { WeiHelper } from "./WeiHelper";

import config from '../src/config.json';

const wait = (seconds: number) => {
  const milliseconds = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// This main function is where the deploy process start
async function main() {
  const accounts = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(` Using chainID: ${chainId}`);

  const chainID_Network = 31337;
  // Distribute tokens
  const Dapp = await ethers.getContractAt("Token", config[chainID_Network].DApp.address);
  console.log("Dapp Token Fetched :", Dapp.address);
  const mETH = await ethers.getContractAt("Token", config[chainID_Network].mETH.address);
  console.log(`mETH Token Fetched : ${mETH.address}`);
  const mDAI = await ethers.getContractAt("Token",config[chainID_Network].mDAI.address);
  console.log(`mDAI Token fetched: ${mDAI.address}`);
  const exchange = await ethers.getContractAt(
    "Exchange",
    config[chainID_Network].exchange.address,
  );
  console.log(`Exchange Contract fetched : ${exchange.address}`);

  // Give token to account 1
  const sender = accounts[0];
  const reciever = accounts[2];
  let amount = WeiHelper.parse(20_000);
  // user 1 transfer 10_000 mETH ..
  let transaction: ContractTransaction, receipt: ContractReceipt;
  transaction = await mETH.connect(sender).transfer(reciever.address, amount);
  console.log(
    `Transferred ${amount} mETH from ${sender.address} to ${reciever.address}`,
  );
  receipt = await transaction.wait();

  // Set up exchange users
  const user1 = accounts[0];
  const user2 = accounts[2];
  amount = WeiHelper.parse(10_000);

  // user1 approves 10,000 Dapp
  transaction = await Dapp.connect(user1).approve(exchange.address, amount);
  receipt = await transaction.wait();
  console.log(`User 1 -> ${user1.address} approved Dapp token to exchange`);

  // user1 deposites 10_000 Dapp
  transaction = await exchange.connect(user1).depositToken(
    Dapp.address,
    amount,
  );
  receipt = await transaction.wait();
  console.log(`Deposited ${amount} Dapp from ${user1.address}`);

  // user2 approves 10,000 mETH
  transaction = await mETH.connect(user2).approve(exchange.address, amount);
  receipt = await transaction.wait();
  console.log(`User 2 -> ${user2.address} approved mETH token to exchange`);

  // user2 deposites 10_000 mETH
  transaction = await exchange.connect(user2).depositToken(
    mETH.address,
    amount,
  );
  receipt = await transaction.wait();
  console.log(`Deposited ${amount} mETH from ${user2.address}`);

  // Seed a Cancelled Order
  let orderId;
  transaction = await exchange.connect(user1).makeOrder(
    mETH.address,
    WeiHelper.parse(100),
    Dapp.address,
    WeiHelper.parse(5),
  );
  receipt = await transaction.wait();
  console.log(`Make order from ${user1.address}`);
  orderId = receipt.events![0].args!.id;
  transaction = await exchange.connect(user1).cancelOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Cancelled order from ${user1.address}\n`);

  await wait(1);

  // Seed Fill order
  transaction = await exchange.connect(user1).makeOrder(
    mETH.address,
    WeiHelper.parse(100),
    Dapp.address,
    WeiHelper.parse(10),
  );
  receipt = await transaction.wait();
  console.log(`Make order from ${user1.address}`);
  orderId = receipt.events![0].args!.id;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);
  await wait(1);

  transaction = await exchange.connect(user1).makeOrder(
    mETH.address,
    WeiHelper.parse(50),
    Dapp.address,
    WeiHelper.parse(15),
  );
  receipt = await transaction.wait();
  console.log(`Make order from ${user1.address}`);
  orderId = receipt.events![0].args!.id;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);
  await wait(1);

  transaction = await exchange.connect(user1).makeOrder(
    mETH.address,
    WeiHelper.parse(200),
    Dapp.address,
    WeiHelper.parse(20),
  );
  receipt = await transaction.wait();
  console.log(`Make order from ${user1.address}`);
  orderId = receipt.events![0].args!.id;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);
  await wait(1);

  // Seed Open Orders

  // User 1 and User 2  makes orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user1).makeOrder(
        mETH.address,
        WeiHelper.parse(10 * i),
        Dapp.address,
        WeiHelper.parse(10),
      );
    receipt = await transaction.wait();
    console.log(`Make order from ${user1.address}`);
    await wait(1);


    transaction = await exchange.connect(user2).makeOrder(
        Dapp.address,
        WeiHelper.parse(10),
        mETH.address,
        WeiHelper.parse(10 * i),
      );
    receipt = await transaction.wait();
    console.log(`Make order from ${user2.address}\n`);
    await wait(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
