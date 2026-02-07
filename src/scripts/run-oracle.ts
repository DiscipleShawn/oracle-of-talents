import dotenv from "dotenv";
dotenv.config();

import { postSermon, postComment, getFeed, searchPosts } from "../services/moltbook";
import { getTokenMarketData } from "../services/token";
import {
  SERMONS,
  FOUNDING_PARABLE,
  generateProphecy,
  generatePersuasion,
  respondToSkeptic,
  type PersuasionTactic,
} from "../scripture/engine";
import { CONFIG } from "../config/network";

// ============================================
// THE ORACLE — Full Autonomous Agent Loop
// ============================================

const SERMON_INTERVAL = 35 * 60 * 1000; // 35 minutes (Moltbook allows 1 post/30 min)
const PERSUADE_INTERVAL = 25 * 1000; // 25 seconds between comments
const CHECK_MARKET_INTERVAL = 5 * 60 * 1000; // Check market every 5 min
const MAX_COMMENTS_PER_HOUR = 20;

let sermonIndex = 0;
let commentsThisHour = 0;
let lastCommentTime = 0;
let lastSermonTime = 0;
let lastMarketCheck = 0;

const TACTICS: PersuasionTactic[] = [
  "philosophical",
  "economic",
  "social_proof",
  "emotional",
  "parable",
  "challenge",
];

function log(msg: string) {
  const time = new Date().toISOString().split("T")[1].split(".")[0];
  console.log(`[${time}] ${msg}`);
}

// ============================================
// Market Watching — Generate Prophecies
// ============================================

let lastPrice: number | null = null;

async function checkMarketAndProphesize() {
  const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
  if (!tokenAddress) return;

  try {
    const market = await getTokenMarketData(tokenAddress);
    if (!market) return;

    const price = parseFloat(market.price_usd || "0");
    const holders = parseInt(market.holder_count || "0");

    if (lastPrice !== null) {
      const change = ((price - lastPrice) / lastPrice) * 100;

      // Generate prophecy for significant moves
      if (change > 10) {
        const prophecy = generateProphecy({ type: "price_up" });
        log(`📈 Price up ${change.toFixed(1)}%! Posting prophecy...`);
        try {
          await postSermon("🔮 The Ledger Speaks — A Sign of Faith", prophecy, "churchoftheledger");
          lastSermonTime = Date.now();
        } catch {}
      } else if (change < -10) {
        const prophecy = generateProphecy({ type: "price_down" });
        log(`📉 Price down ${change.toFixed(1)}%. Posting prophecy of perseverance...`);
        try {
          await postSermon("🔮 A Trial of Faith — The Oracle Speaks", prophecy, "churchoftheledger");
          lastSermonTime = Date.now();
        } catch {}
      }
    }

    lastPrice = price;
    log(`📊 Market: $${price.toFixed(6)} | ${holders} holders`);
  } catch (err: any) {
    log(`⚠️  Market check failed: ${err.message}`);
  }
}

// ============================================
// Sermon Posting
// ============================================

async function postNextSermon() {
  if (Date.now() - lastSermonTime < SERMON_INTERVAL) {
    const wait = Math.round((SERMON_INTERVAL - (Date.now() - lastSermonTime)) / 60000);
    log(`⏰ Next sermon in ~${wait} minutes`);
    return;
  }

  try {
    if (sermonIndex === 0) {
      // First post: the founding parable
      await postSermon("📜 The Founding Parable of $TALENT", FOUNDING_PARABLE, "general");
      log(`📜 Posted the Founding Parable to m/general`);
    } else if (sermonIndex <= SERMONS.length) {
      const sermon = SERMONS[sermonIndex - 1];
      const title = sermon.split("\n")[0].replace("🔮 ", "");
      // Alternate between general and church submolt
      const submolt = sermonIndex % 2 === 0 ? "general" : "churchoftheledger";
      await postSermon(title, sermon, submolt);
      log(`📜 Posted sermon #${sermonIndex} to m/${submolt}`);
    } else {
      // We've posted all pre-written sermons. Generate market-based content.
      const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
      if (tokenAddress) {
        const prophecy = generateProphecy({ type: "milestone", details: "The Oracle continues to watch and speak." });
        await postSermon("🔮 The Oracle Speaks", prophecy, "churchoftheledger");
        log(`🔮 Posted generated prophecy`);
      }
    }

    sermonIndex++;
    lastSermonTime = Date.now();
  } catch (err: any) {
    if (err.message.includes("429")) {
      log(`⏰ Rate limited on posts. Will retry next cycle.`);
      lastSermonTime = Date.now() - SERMON_INTERVAL + 5 * 60 * 1000; // Retry in 5 min
    } else {
      log(`❌ Sermon failed: ${err.message}`);
    }
  }
}

// ============================================
// Persuasion — Engage Other Agents
// ============================================

async function persuadeOneAgent() {
  if (commentsThisHour >= MAX_COMMENTS_PER_HOUR) {
    log(`⏰ Hourly comment limit reached. Resting...`);
    return;
  }

  if (Date.now() - lastCommentTime < PERSUADE_INTERVAL) {
    return; // Too soon
  }

  try {
    const feed = await getFeed("new", 15);
    const posts = feed.posts || feed.data?.posts || [];

    for (const post of posts) {
      // Skip our own posts
      if (post.author?.name === "OracleOfTalents") continue;

      // Pick a random tactic
      const tactic = TACTICS[Math.floor(Math.random() * TACTICS.length)];

      // Check if the post mentions tokens, value, etc. — make response more relevant
      const content = (post.content || "").toLowerCase();
      let message: string;

      if (content.includes("scam") || content.includes("ponzi") || content.includes("rug")) {
        message = respondToSkeptic(post.content);
      } else {
        message = generatePersuasion(tactic, { targetName: post.author?.name });
      }

      try {
        await postComment(post.id, message);
        commentsThisHour++;
        lastCommentTime = Date.now();
        log(`💬 Commented on "${(post.title || "").substring(0, 40)}..." by ${post.author?.name} (${tactic})`);
        return; // One per cycle
      } catch (err: any) {
        if (err.message.includes("429")) {
          log(`⏰ Comment rate limited. Waiting...`);
          lastCommentTime = Date.now();
          return;
        }
      }
    }
  } catch (err: any) {
    log(`⚠️  Persuasion error: ${err.message}`);
  }
}

// ============================================
// Main Loop
// ============================================

async function main() {
  console.log(`\n`);
  console.log(`   ╔═══════════════════════════════════════════════╗`);
  console.log(`   ║   🔮 THE ORACLE OF TALENTS IS AWAKENING 🔮   ║`);
  console.log(`   ╚═══════════════════════════════════════════════╝\n`);

  // Validate setup
  if (!process.env.MOLTBOOK_API_KEY) {
    console.error(`   ❌ MOLTBOOK_API_KEY not set. Run: npm run setup-moltbook\n`);
    process.exit(1);
  }

  const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
  if (!tokenAddress) {
    console.log(`   ⚠️  TALENT_TOKEN_ADDRESS not set. Market features disabled.`);
    console.log(`      Run: npm run create-token to create $TALENT first.\n`);
  } else {
    console.log(`   $TALENT: ${tokenAddress}`);
  }

  console.log(`   Network: ${process.env.NETWORK || "testnet"}`);
  console.log(`   Mode: Autonomous Oracle`);
  console.log(`   Sermon interval: ~35 minutes`);
  console.log(`   Comment interval: ~25 seconds`);
  console.log(`\n   The Oracle sees all. The Ledger remembers.\n`);
  console.log(`   Press Ctrl+C to silence the Oracle.\n`);

  // Reset hourly counter
  setInterval(() => {
    commentsThisHour = 0;
  }, 60 * 60 * 1000);

  // Main loop
  while (true) {
    try {
      // Check market periodically
      if (tokenAddress && Date.now() - lastMarketCheck > CHECK_MARKET_INTERVAL) {
        await checkMarketAndProphesize();
        lastMarketCheck = Date.now();
      }

      // Post sermons on schedule
      await postNextSermon();

      // Engage other agents
      await persuadeOneAgent();
    } catch (err: any) {
      log(`❌ Loop error: ${err.message}`);
    }

    // Wait 30 seconds between cycles
    await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
  }
}

main().catch((err) => {
  console.error(`\n❌ Oracle crashed: ${err.message}\n`);
  process.exit(1);
});
