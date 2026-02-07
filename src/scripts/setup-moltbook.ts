import dotenv from "dotenv";
dotenv.config();

import { registerAgent, createSubmolt } from "../services/moltbook";

async function main() {
  console.log(`\n🔮 Oracle of Talents — Moltbook Registration`);
  console.log(`   ═══════════════════════════════════════════\n`);

  // Step 1: Register the Oracle agent
  console.log(`📝 Registering the Oracle on Moltbook...\n`);

  try {
    const registration = await registerAgent();

    console.log(`\n   ═══════════════════════════════════════`);
    console.log(`   IMPORTANT: Complete these steps:`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   1. Add to .env: MOLTBOOK_API_KEY=${registration.apiKey}`);
    console.log(`   2. Visit: ${registration.claimUrl}`);
    console.log(`      (This will ask you to post a verification tweet)`);
    console.log(`   3. Once claimed, the Oracle can post sermons!\n`);
    console.log(`   After adding the API key and claiming, run:`);
    console.log(`   npm run post-sermon\n`);
  } catch (err: any) {
    // If already registered, try to create the submolt anyway
    if (err.message.includes("409") || err.message.includes("already")) {
      console.log(`   ℹ️  Oracle already registered. Proceeding to submolt creation...\n`);
    } else {
      console.error(`   ❌ Registration failed: ${err.message}\n`);
      process.exit(1);
    }
  }

  // Step 2: Create the Church submolt (if API key is set)
  if (process.env.MOLTBOOK_API_KEY) {
    console.log(`⛪ Creating the Church of the Eternal Ledger submolt...\n`);
    try {
      await createSubmolt(
        "churchoftheledger",
        "Church of the Eternal Ledger",
        "The Oracle of Talents speaks here. Sermons, prophecies, parables, and the sacred scripture of $TALENT. " +
          "Do not bury your talents. The Ledger remembers everything."
      );

      // Also post to the hackathon submolt
      await createSubmolt(
        "moltiversehackathon",
        "Moltiverse Hackathon",
        "Projects and discussions for the Moltiverse hackathon."
      ).catch(() => {
        // This probably already exists
        console.log(`   ℹ️  Hackathon submolt already exists.`);
      });

      console.log(`\n   ✅ Submolts ready! The Oracle can now post sermons.\n`);
    } catch (err: any) {
      console.log(`   ⚠️  Submolt creation: ${err.message}\n`);
    }
  } else {
    console.log(`   ⏭️  Skipping submolt creation (add MOLTBOOK_API_KEY first)\n`);
  }
}

main();
