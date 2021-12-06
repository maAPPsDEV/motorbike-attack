import { DeployFunction } from "hardhat-deploy/types";

const deployHacker: DeployFunction = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { hacker } = await getNamedAccounts();

  const result = await deploy("Hacker", {
    from: hacker,
    args: [],
    log: true,
  });
  console.log("Hacker contract deployed at", result.address);
};

export default deployHacker;
deployHacker.tags = ["Hacker"];
deployHacker.dependencies = [];
