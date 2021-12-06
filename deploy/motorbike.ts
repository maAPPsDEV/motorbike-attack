import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const deployMotorbike: DeployFunction = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Engine", {
    from: deployer,
    args: [],
    log: true,
  });
  const engine = await ethers.getContract("Engine");
  console.log("Engine deployed at", engine.address);

  const result = await deploy("Motorbike", {
    from: deployer,
    args: [engine.address],
    log: true,
  });
  console.log("Motorbike deployed at", result.address);
};

export default deployMotorbike;
deployMotorbike.tags = ["Motorbike"];
deployMotorbike.dependencies = [];
