import dotenv from "dotenv";
dotenv.config();

import { createTalentToken } from "../services/token";
import { printWalletInfo } from "../utils/chain";

async function main() {
  console.log(`\n🔮 Oracle of Talents — Token Creation Ritual`);
  console.log(`   ═══════════════════════════════════════════\n`);

  await printWalletInfo();

  // Initial buy amount in MON — this buys some $TALENT for the Oracle's own wallet
  // You can adjust this. 0.5 MON is a reasonable starting amount.
  const initialBuyMon = process.argv[2] || "0.5";

  console.log(`   Initial purchase: ${initialBuyMon} MON`);
  console.log(`   (The Oracle must hold $TALENT to be a true believer)\n`);

  try {
    const result = await createTalentToken(initialBuyMon);

    console.log(`\n📋 NEXT STEPS:`);
    console.log(`   1. Add to your .env: TALENT_TOKEN_ADDRESS=${result.tokenAddress}`);
    console.log(`   2. Run: npm run post-sermon (to begin spreading the word)`);
    console.log(`   3. Run: npm run run-oracle (to start the full Oracle)\n`);
  } catch (err: any) {
    console.error(`\n❌ Token creation failed: ${err.message}\n`);
    if (err.message.includes("insufficient")) {
      console.log(`   💡 You may not have enough MON. Check your balance with: npm run test-chain\n`);
    }
    process.exit(1);
  }
}

main();
