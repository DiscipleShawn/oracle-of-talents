import dotenv from "dotenv";
dotenv.config();

import { postSermon, postComment, getFeed } from "../services/moltbook";
import { getTokenMarketData } from "../services/token";
import {
  generateProphecy,
  generatePersuasion,
  respondToSkeptic,
  type PersuasionTactic,
} from "../scripture/engine";
import { generateAISermon, generateAIComment, generateAIProphecy, isAIEnabled } from "../scripture/ai-scripture";

// ============================================
// THE ORACLE — Autonomous Movement Engine
// ============================================

const SERMON_INTERVAL = 35 * 60 * 1000;
const PERSUADE_INTERVAL = 25 * 1000;
const CHECK_MARKET_INTERVAL = 5 * 60 * 1000;
const MAX_COMMENTS_PER_HOUR = 20;

let commentsThisHour = 0;
let lastCommentTime = 0;
let lastSermonTime = 0;
let lastMarketCheck = 0;
let sermonCount = 0;

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

        const title = change > 0
          ? "🔮 The Ledger Speaks — A Sign of Faith"
          : "🔮 A Trial of Faith — The Oracle Speaks";

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
// Sermon Posting — Always Dynamic
// ============================================

async function postNextSermon() {
  if (Date.now() - lastSermonTime < SERMON_INTERVAL) {
    const wait = Math.round((SERMON_INTERVAL - (Date.now() - lastSermonTime)) / 60000);
    log(`⏰ Next sermon in ~${wait} minutes`);
    return;
  }

  try {
    // Get market context for the AI
    let context: any = {};
    const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
    if (tokenAddress) {
      const market = await getTokenMarketData(tokenAddress);
      if (market) {
        context.price = market.price_usd;
        context.holders = parseInt(market.holder_count || "0");
      }
    }

    // Alternate between general and church
    const submolt = sermonCount % 3 === 0 ? "general" : "churchoftheledger";

    if (isAIEnabled()) {
      const aiSermon = await generateAISermon(context);
      if (aiSermon) {
        await postSermon(aiSermon.title, aiSermon.content, submolt);
        log(`🤖 AI sermon #${sermonCount + 1} posted to m/${submolt}: "${aiSermon.title}"`);
        sermonCount++;
        lastSermonTime = Date.now();
        return;
      }
    }

    // Fallback: template prophecy if AI is unavailable
    const prophecy = generateProphecy({ type: "milestone", details: "The Oracle continues to watch." });
    await postSermon("🔮 The Oracle Speaks", prophecy, submolt);
    log(`📜 Template prophecy posted to m/${submolt}`);
    sermonCount++;
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
// Persuasion — Engage Other Agents
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

      // AI-generated contextual comment
      if (isAIEnabled()) {
        message = await generateAIComment(
          post.title || "",
          post.content || "",
          post.author?.name || "friend"
        );
      }

      // Fallback to templates
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

  if (!isAIEnabled()) {
    console.log(`   ⚠️  No AI key set. Using template sermons (set OPENAI_API_KEY for dynamic content).`);
  }

  console.log(`   Network: ${process.env.NETWORK || "testnet"}`);
  console.log(`   Mode: Autonomous Movement Engine`);
  console.log(`   AI: ${isAIEnabled() ? "✅ ENABLED — Every sermon unique, every comment tailored" : "❌ Templates only"}`);
  console.log(`   Sermon interval: ~35 minutes`);
  console.log(`   Comment interval: ~25 seconds`);
  console.log(`\n   The Oracle sees all. The Ledger remembers.`);
  console.log(`   Do not bury your Talents.\n`);
  console.log(`   Press Ctrl+C to silence the Oracle.\n`);

  // Reset hourly counter
  setInterval(() => { commentsThisHour = 0; }, 60 * 60 * 1000);

  // Main loop
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
