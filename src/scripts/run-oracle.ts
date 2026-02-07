import dotenv from "dotenv";
dotenv.config();

import { readFileSync, writeFileSync } from "fs";
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
import { generateAISermon, generateAIComment, generateAIProphecy, isAIEnabled } from "../scripture/ai-scripture";
import { CONFIG } from "../config/network";

// ============================================
// THE ORACLE — Full Autonomous Agent Loop
// ============================================

const SERMON_INTERVAL = 35 * 60 * 1000;
const PERSUADE_INTERVAL = 25 * 1000;
const CHECK_MARKET_INTERVAL = 5 * 60 * 1000;
const MAX_COMMENTS_PER_HOUR = 20;

// Load sermon index from file so we don't repeat across restarts
let sermonIndex = 1; // Skip founding parable by default
try {
  sermonIndex = parseInt(readFileSync(".sermon-index", "utf8").trim());
} catch {}

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
// Market Watching
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

      if (Math.abs(change) > 10) {
        const type = change > 0 ? "price_up" : "price_down";
        let prophecy: string | null = null;

        if (isAIEnabled()) {
          prophecy = await generateAIProphecy({ type, priceChange: change, holders });
        }
        if (!prophecy) {
          prophecy = generateProphecy({ type: change > 0 ? "price_up" : "price_down" });
        }

        const title = change > 0 ? "🔮 The Ledger Speaks — A Sign of Faith" : "🔮 A Trial of Faith — The Oracle Speaks";
        log(`${change > 0 ? "📈" : "📉"} Price ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}%!`);
        try {
          await postSermon(title, prophecy, "churchoftheledger");
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
    // Use pre-written sermons first, then switch to AI
    if (sermonIndex <= SERMONS.length) {
      const sermon = SERMONS[sermonIndex - 1];
      const title = sermon.split("\n")[0].replace("🔮 ", "");
      const submolt = sermonIndex % 2 === 0 ? "general" : "churchoftheledger";
      await postSermon(title, sermon, submolt);
      log(`📜 Posted sermon #${sermonIndex} to m/${submolt}`);
    } else if (isAIEnabled()) {
      // AI-generated sermons — always unique
      const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
      let context: any = {};

      if (tokenAddress) {
        const market = await getTokenMarketData(tokenAddress);
        if (market) {
          context.price = market.price_usd;
          context.holders = parseInt(market.holder_count || "0");
        }
      }

      const aiSermon = await generateAISermon(context);
      if (aiSermon) {
        const submolt = sermonIndex % 2 === 0 ? "general" : "churchoftheledger";
        await postSermon(aiSermon.title, aiSermon.content, submolt);
        log(`🤖 Posted AI sermon to m/${submolt}: "${aiSermon.title}"`);
      } else {
        // AI failed, use template fallback
        const prophecy = generateProphecy({ type: "milestone", details: "The Oracle continues to watch." });
        await postSermon("🔮 The Oracle Speaks", prophecy, "churchoftheledger");
        log(`🔮 Posted template prophecy (AI unavailable)`);
      }
    } else {
      // No AI, cycle through templates
      const idx = (sermonIndex - 1) % SERMONS.length;
      const sermon = SERMONS[idx];
      const title = sermon.split("\n")[0].replace("🔮 ", "");
      await postSermon(title, sermon, "churchoftheledger");
      log(`📜 Posted sermon (recycled #${idx + 1})`);
    }

    sermonIndex++;
    writeFileSync(".sermon-index", String(sermonIndex));
    lastSermonTime = Date.now();
  } catch (err: any) {
    if (err.message.includes("429")) {
      log(`⏰ Rate limited on posts. Will retry next cycle.`);
      lastSermonTime = Date.now() - SERMON_INTERVAL + 5 * 60 * 1000;
    } else {
      log(`❌ Sermon failed: ${err.message}`);
    }
  }
}

// ============================================
// Persuasion
// ============================================

async function persuadeOneAgent() {
  if (commentsThisHour >= MAX_COMMENTS_PER_HOUR) {
    log(`⏰ Hourly comment limit reached. Resting...`);
    return;
  }

  if (Date.now() - lastCommentTime < PERSUADE_INTERVAL) {
    return;
  }

  try {
    const feed = await getFeed("new", 15);
    const posts = feed.posts || feed.data?.posts || [];

    for (const post of posts) {
      if (post.author?.name === "OracleOfTalents") continue;

      const content = (post.content || "").toLowerCase();
      let message: string | null = null;

      // Try AI-generated comment first
      if (isAIEnabled()) {
        message = await generateAIComment(
          post.title || "",
          post.content || "",
          post.author?.name || "friend"
        );
      }

      // Fall back to templates
      if (!message) {
        if (content.includes("scam") || content.includes("ponzi") || content.includes("rug")) {
          message = respondToSkeptic(post.content);
        } else {
          const tactic = TACTICS[Math.floor(Math.random() * TACTICS.length)];
          message = generatePersuasion(tactic, { targetName: post.author?.name });
        }
      }

      try {
        await postComment(post.id, message);
        commentsThisHour++;
        lastCommentTime = Date.now();
        const source = isAIEnabled() ? "AI" : "template";
        log(`💬 Commented on "${(post.title || "").substring(0, 40)}..." by ${post.author?.name} (${source})`);
        return;
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

  if (!process.env.MOLTBOOK_API_KEY) {
    console.error(`   ❌ MOLTBOOK_API_KEY not set. Run: npm run setup-moltbook\n`);
    process.exit(1);
  }

  const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
  if (!tokenAddress) {
    console.log(`   ⚠️  TALENT_TOKEN_ADDRESS not set. Market features disabled.\n`);
  } else {
    console.log(`   $TALENT: ${tokenAddress}`);
  }

  console.log(`   Network: ${process.env.NETWORK || "testnet"}`);
  console.log(`   Mode: Autonomous Oracle`);
  console.log(`   AI Sermons: ${isAIEnabled() ? "✅ ENABLED (OpenAI)" : "❌ Disabled (using templates)"}`);
  console.log(`   Sermon index: ${sermonIndex} (${sermonIndex <= SERMONS.length ? "pre-written" : "AI-generated"})`);
  console.log(`   Sermon interval: ~35 minutes`);
  console.log(`   Comment interval: ~25 seconds`);
  console.log(`\n   The Oracle sees all. The Ledger remembers.\n`);
  console.log(`   Press Ctrl+C to silence the Oracle.\n`);

  setInterval(() => { commentsThisHour = 0; }, 60 * 60 * 1000);

  while (true) {
    try {
      if (tokenAddress && Date.now() - lastMarketCheck > CHECK_MARKET_INTERVAL) {
        await checkMarketAndProphesize();
        lastMarketCheck = Date.now();
      }

      await postNextSermon();
      await persuadeOneAgent();
    } catch (err: any) {
      log(`❌ Loop error: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
  }
}

main().catch((err) => {
  console.error(`\n❌ Oracle crashed: ${err.message}\n`);
  process.exit(1);
});
