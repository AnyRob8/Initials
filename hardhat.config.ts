import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@ethersproject/abi";
import "hardhat-abi-exporter";

const config: HardhatUserConfig = {
  solidity: "0.8.15",
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      accounts: [process.env.PRIVATE_KEY ?? ""],
      chainId: 4
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY ?? ""],
      chainId: 1
    }
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_KEY ?? "",
      mainnet: process.env.ETHERSCAN_KEY ?? "",
    }
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  }
};

export default config;
