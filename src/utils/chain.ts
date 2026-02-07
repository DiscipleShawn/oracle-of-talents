import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONFIG, CURRENT_NETWORK } from "../config/network";

// ============================================
// Chain Definition
// ============================================

export const monadChain: Chain = {
  id: CONFIG.chainId,
  name: CURRENT_NETWORK === "mainnet" ? "Monad" : "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [CONFIG.rpcUrl] },
  },
};

// ============================================
// Account & Clients
// ============================================

function getAccount() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error(
      "❌ PRIVATE_KEY not set in .env file!\n" +
        "   Copy .env.example to .env and add your wallet private key."
    );
  }
  return privateKeyToAccount(pk as `0x${string}`);
}

let _publicClient: PublicClient | null = null;
let _walletClient: WalletClient | null = null;

export function getPublicClient(): PublicClient {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: monadChain,
      transport: http(CONFIG.rpcUrl),
    }) as PublicClient;
  }
  return _publicClient;
}

export function getWalletClient(): WalletClient {
  if (!_walletClient) {
    const account = getAccount();
    _walletClient = createWalletClient({
      account,
      chain: monadChain,
      transport: http(CONFIG.rpcUrl),
    });
  }
  return _walletClient;
}

export function getAddress(): `0x${string}` {
  return getAccount().address;
}

// ============================================
// Utility Functions
// ============================================

export async function getBalance(): Promise<string> {
  const client = getPublicClient();
  const balance = await client.getBalance({ address: getAddress() });
  return formatEther(balance);
}

export async function printWalletInfo(): Promise<void> {
  const address = getAddress();
  const balance = await getBalance();
  console.log(`\n🔮 Oracle Wallet`);
  console.log(`   Network:  ${CURRENT_NETWORK} (chain ${CONFIG.chainId})`);
  console.log(`   Address:  ${address}`);
  console.log(`   Balance:  ${balance} MON\n`);
}
