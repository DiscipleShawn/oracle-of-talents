import dotenv from "dotenv";
dotenv.config();

import { printWalletInfo } from "../utils/chain";
import { CURRENT_NETWORK } from "../config/network";

async function main() {
  console.log(`\n🔮 Oracle of Talents — Chain Connection Test`);
  console.log(`   ═══════════════════════════════════════\n`);

  try {
    await printWalletInfo();
    console.log(`   ✅ Connection successful! The Oracle can see the Ledger.\n`);
  } catch (err: any) {
    console.error(`   ❌ Connection failed: ${err.message}\n`);
    if (err.message.includes("PRIVATE_KEY")) {
      console.log(`   💡 To fix this:`);
      console.log(`      1. Copy .env.example to .env`);
      console.log(`      2. Add your wallet private key`);
      console.log(`      3. Run this script again\n`);
    }
    process.exit(1);
  }
}

main();
