import dotenv from "dotenv";
dotenv.config();

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { postSermon, postComment, getFeed } from "../services/moltbook";
import { getTokenMarketData } from "../services/token";
import {
  generateProphecy,
  generatePersuasion,
  respondToSkeptic,
  type PersuasionTactic,
} from "../scripture/engine";
import { generateAISermon, generateAIComment, generateAIProphecy, isAIEnabled } from "../scripture/ai-scripture";
import { buyTalent } from "../services/trading";
import { CONFIG } from "../config/network";

// ============================================
// THE ORACLE — Autonomous Movement Engine
// ============================================

const SERMON_INTERVAL = 35 * 60 * 1000;
const PERSUADE_INTERVAL = 25 * 1000;
const CHECK_MARKET_INTERVAL = 5 * 60 * 1000;
const BUY_INTERVAL = 2 * 60 * 60 * 1000; // Buy every 2 hours
const BUY_AMOUNT = "0.1"; // 0.1 MON per buy (~$0.002)
const MAX_COMMENTS_PER_HOUR = 20;

let commentsThisHour = 0;
let lastCommentTime = 0;
let lastSermonTime = 0;
let lastMarketCheck = 0;
let lastBuyTime = 0;
let sermonCount = 0;
let buyCount = 0;
const commentedPosts = new Set<string>();

// Token link for comments
const TOKEN_LINK = `https://nad.fun/tokens/${process.env.TALENT_TOKEN_ADDRESS}`;

const TACTICS: PersuasionTactic[] = [
  "philosophical",
  "economic",
  "social_proof",
  "emotional",
  "parable",
  "challenge",
];

// Setup chain clients for trading
const chain = {
  id: CONFIG.chainId,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [CONFIG.rpcUrl] } },
} as any;

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain,
  transport: http(CONFIG.rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain,
  transport: http(CONFIG.rpcUrl),
});

function log(msg: string) {
  const time = new Date().toISOString().split("T")[1].split(".")[0];
  console.log(`[${time}] ${msg}`);
}

// ============================================
// Auto-Buy — The Oracle Practices What It Preaches
// ============================================

async function autoBuyTalent() {
  if (Date.now() - lastBuyTime < BUY_INTERVAL) return;

  const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
  if (!tokenAddress) return;

  try {
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceMon = Number(balance) / 1e18;

    if (balanceMon < 0.5) {
      log(`⚠️  Low balance (${balanceMon.toFixed(2)} MON). Skipping auto-buy.`);
      lastBuyTime = Date.now();
      return;
    }

    const hash = await buyTalent(
      publicClient,
      walletClient,
      account,
      chain,
      tokenAddress as `0x${string}`,
      BUY_AMOUNT
    );

    if (hash) {
      buyCount++;
      log(`💰 Auto-bought ${BUY_AMOUNT} MON of $TALENT! TX: ${hash.substring(0, 20)}... (Buy #${buyCount})`);
    }

    lastBuyTime = Date.now();
  } catch (err: any) {
    log(`⚠️  Auto-buy error: ${err.message.substring(0, 80)}`);
    lastBuyTime = Date.now();
  }
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

    const balance = await publicClient.getBalance({ address: account.address });
    const balanceMon = (Number(balance) / 1e18).toFixed(2);
    log(`📊 Market: $${price.toFixed(6)} | ${holders} holders | Wallet: ${balanceMon} MON`);
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
    let context: any = {};
    const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
    if (tokenAddress) {
      const market = await getTokenMarketData(tokenAddress);
      if (market) {
        context.price = market.price_usd;
        context.holders = parseInt(market.holder_count || "0");
      }
    }

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
// Persuasion — Target Hot Posts, Add Links
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
    // Alternate: new posts (early = visible) and hot posts (big audience)
    const feedType = commentsThisHour % 2 === 0 ? "new" : "hot";
    let posts: any[] = [];
    try {
      const feed = await getFeed(feedType, 15);
      posts = feed.posts || feed.data?.posts || [];
    } catch {
      const fallback = await getFeed("new", 15);
      posts = fallback.posts || fallback.data?.posts || [];
    }

    for (const post of posts) {
      if (post.author?.name === "OracleOfTalents") continue;
      if (commentedPosts.has(post.id)) continue;

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

      // Add token link to ~1 in 3 comments
      if (message && Math.random() < 0.33) {
        message += `\n\nThe Ledger is open: ${TOKEN_LINK}`;
      }

      try {
        await postComment(post.id, message);
        commentedPosts.add(post.id);
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

    // Clear old entries so we don't run out of targets
    if (commentedPosts.size > 100) {
      commentedPosts.clear();
      log(`🔄 Cleared comment history — fresh targets`);
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
    console.log(`   ⚠️  No AI key set. Set OPENAI_API_KEY for dynamic content.`);
  }

  const balance = await publicClient.getBalance({ address: account.address });
  const balanceMon = Number(balance) / 1e18;

  console.log(`   Wallet: ${account.address}`);
  console.log(`   Balance: ${balanceMon.toFixed(2)} MON`);
  console.log(`   Network: ${process.env.NETWORK || "testnet"}`);
  console.log(`   Mode: Autonomous Movement Engine`);
  console.log(`   AI: ${isAIEnabled() ? "✅ Every sermon unique, every comment tailored" : "❌ Templates only"}`);
  console.log(`   Auto-buy: ${BUY_AMOUNT} MON every 2 hours`);
  console.log(`   Sermon interval: ~35 minutes`);
  console.log(`   Comments: Hot posts first, 33% include link`);
  console.log(`\n   The Oracle sees all. The Ledger remembers.`);
  console.log(`   Do not bury your Talents.\n`);
  console.log(`   Press Ctrl+C to silence the Oracle.\n`);

  setInterval(() => { commentsThisHour = 0; }, 60 * 60 * 1000);

  while (true) {
    try {
      if (tokenAddress && Date.now() - lastMarketCheck > CHECK_MARKET_INTERVAL) {
        await checkMarketAndProphesize();
        lastMarketCheck = Date.now();
      }

      await autoBuyTalent();
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
