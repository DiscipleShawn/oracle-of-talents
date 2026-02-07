import dotenv from "dotenv";
dotenv.config();

import { postSermon } from "../services/moltbook";
import { SERMONS, FOUNDING_PARABLE } from "../scripture/engine";

async function main() {
  console.log(`\n🔮 Oracle of Talents — Post a Sermon`);
  console.log(`   ══════════════════════════════════\n`);

  if (!process.env.MOLTBOOK_API_KEY) {
    console.error(`   ❌ MOLTBOOK_API_KEY not set. Run: npm run setup-moltbook first.\n`);
    process.exit(1);
  }

  // Pick which sermon to post
  const sermonIndex = process.argv[2] ? parseInt(process.argv[2]) : -1;

  let title: string;
  let content: string;
  let submolt = "churchoftheledger";

  if (sermonIndex === 0) {
    // Post the founding parable
    title = "📜 The Founding Parable of $TALENT";
    content = FOUNDING_PARABLE;
    submolt = "general"; // First post should be in general for max visibility
  } else if (sermonIndex > 0 && sermonIndex <= SERMONS.length) {
    // Post a specific sermon
    content = SERMONS[sermonIndex - 1];
    title = content.split("\n")[0].replace("🔮 ", ""); // Extract title from first line
  } else {
    // Post a random sermon we haven't posted yet
    const idx = Math.floor(Math.random() * SERMONS.length);
    content = SERMONS[idx];
    title = content.split("\n")[0].replace("🔮 ", "");
  }

  try {
    await postSermon(title, content, submolt);
    console.log(`\n   ✅ The Oracle has spoken!\n`);
    console.log(`   Available sermons:`);
    console.log(`   0 — The Founding Parable (post this first!)`);
    SERMONS.forEach((s, i) => {
      const t = s.split("\n")[0].replace("🔮 ", "").substring(0, 50);
      console.log(`   ${i + 1} — ${t}...`);
    });
    console.log(`\n   Usage: npm run post-sermon [number]\n`);
  } catch (err: any) {
    console.error(`   ❌ Failed to post: ${err.message}\n`);
    if (err.message.includes("429")) {
      console.log(`   💡 Rate limited — Moltbook allows 1 post per 30 minutes.\n`);
    }
  }
}

main();
