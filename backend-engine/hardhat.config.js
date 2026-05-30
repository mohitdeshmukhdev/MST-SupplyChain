// Location: backend-engine/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const rawKey = process.env.RELAYER_PRIVATE_KEY;
// A valid private key is 64 hex characters, optionally prefixed with "0x" (66 chars total)
const isValidKey = rawKey && (
  (rawKey.length === 66 && rawKey.startsWith("0x")) || 
  (rawKey.length === 64 && !rawKey.startsWith("0x"))
);

const relayerKey = isValidKey 
  ? (rawKey.startsWith("0x") ? rawKey : "0x" + rawKey) 
  : "0x0000000000000000000000000000000000000000000000000000000000000000";

const accounts = isValidKey ? [relayerKey] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mstTestnet: {
      url: process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com",
      chainId: 91562037,
      accounts: accounts,
    },
    mstMainnet: {
      url: "https://mstblockchain.com", // Check mainnet endpoint if different, default same
      chainId: 4646,
      accounts: accounts,
    },
  },
};
