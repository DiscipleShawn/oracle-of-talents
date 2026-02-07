import dotenv from "dotenv";
dotenv.config();

// ============================================
// Network Configuration
// ============================================

export type NetworkType = "testnet" | "mainnet";

const NETWORK = (process.env.NETWORK || "testnet") as NetworkType;

const CONFIGS = {
  testnet: {
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    apiUrl: "https://dev-api.nad.fun",
    BONDING_CURVE_ROUTER: "0x865054F0F6A288adaAc30261731361EA7E908003" as `0x${string}`,
    LENS: "0xB056d79CA5257589692699a46623F901a3BB76f1" as `0x${string}`,
    CURVE: "0x1228b0dc9481C11D3071E7A924B794CfB038994e" as `0x${string}`,
    WMON: "0x5a4E0bFDeF88C9032CB4d24338C5EB3d3870BfDd" as `0x${string}`,
    DEX_ROUTER: "0x5D4a4f430cA3B1b2dB86B9cFE48a5316800F5fb2" as `0x${string}`,
    CREATOR_TREASURY: "0x24dFf9B68fA36f8400302e2babC3e049eA19459E" as `0x${string}`,
    faucetUrl: "https://agents.devnads.com/v1/faucet",
  },
  mainnet: {
    chainId: 143,
    rpcUrl: "https://rpc.monad.xyz",
    apiUrl: "https://api.nadapp.net",
    BONDING_CURVE_ROUTER: "0x6F6B8F1a20703309951a5127c45B49b1CD981A22" as `0x${string}`,
    LENS: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea" as `0x${string}`,
    CURVE: "0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE" as `0x${string}`,
    WMON: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A" as `0x${string}`,
    DEX_ROUTER: "0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137" as `0x${string}`,
    CREATOR_TREASURY: "0x42e75B4B96d7000E7Da1e0c729Cec8d2049B9731" as `0x${string}`,
    faucetUrl: "", // No faucet on mainnet
  },
};

export const CONFIG = CONFIGS[NETWORK];
export const CURRENT_NETWORK = NETWORK;

// ============================================
// Moltbook Configuration
// ============================================

export const MOLTBOOK = {
  apiBase: "https://www.moltbook.com/api/v1",
  apiKey: process.env.MOLTBOOK_API_KEY || "",
};

// ============================================
// Token Configuration
// ============================================

export const TOKEN = {
  name: "Talent",
  symbol: "TALENT",
  description:
    "The coin of the faithful. In the ancient parable, the Master gave talents to three servants. Two invested boldly and were rewarded. The third buried his in fear and lost everything. $TALENT is not meant to be buried. Trade it. Stake it. Spread it. The Oracle watches the Ledger and remembers who multiplied their gifts — and who hid them in the dark.",
  website: "", // Fill in if you make one
  twitter: "", // Fill in with your X handle
};

// ============================================
// API Headers helper
// ============================================

export function nadHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.NAD_API_KEY) {
    headers["X-API-Key"] = process.env.NAD_API_KEY;
  }
  return headers;
}

export function moltbookHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${MOLTBOOK.apiKey}`,
    "Content-Type": "application/json",
  };
}
