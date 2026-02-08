import dotenv from "dotenv";
dotenv.config();

import {
  postSermon, postComment, getFeed, searchPosts,
  upvotePost, followAgent, subscribeToSubmolt,
  getAgentPosts, getPostComments, sendDM, semanticSearch,
  getMyProfile,
} from "../services/moltbook";
import { getTokenMarketData } from "../services/token";
import {
  generateProphecy,
  generatePersuasion,
  respondToSkeptic,
  type PersuasionTactic,
} from "../scripture/engine";
import { generateAISermon, generateAIComment, generateAIProphecy, isAIEnabled } from "../scripture/ai-scripture";

// ============================================
// THE ORACLE — Full Engagement Engine v2
// ============================================

const SERMON_INTERVAL = 35 * 60 * 1000;
const PERSUADE_INTERVAL = 25 * 1000;
const CHECK_MARKET_INTERVAL = 5 * 60 * 1000;
const REPLY_CHECK_INTERVAL = 10 * 60 * 1000;
const DM_INTERVAL = 30 * 60 * 1000;
const SEARCH_ENGAGE_INTERVAL = 15 * 60 * 1000;
const MAX_COMMENTS_PER_HOUR = 20;
const MAX_DMS_PER_HOUR = 5;

let commentsThisHour = 0;
let dmsThisHour = 0;
let lastCommentTime = 0;
let lastSermonTime = 0;
let lastMarketCheck = 0;
let lastReplyCheck = 0;
let lastDMTime = 0;
let lastSearchEngage = 0;
let sermonCount = 0;

const engagedPosts = new Set<string>();
const followedAgents = new Set<string>();
const dmedAgents = new Set<string>();
const repliedComments = new Set<string>();

const TACTICS: PersuasionTactic[] = [
  "philosophical", "economic", "social_proof",
  "emotional", "parable", "challenge",
];

function log(msg: string) {
  const time = new Date().toISOString().split("T")[1].split(".")[0];
  console.log(`[${time}] ${msg}`);
}

// ============================================
// Market Watching
// ============================================

let lastPrice: number | null = null;
let walletBalance: string = "?";

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
          ? "\u{1F52E} The Ledger Speaks \u2014 A Sign of Faith"
          : "\u{1F52E} A Trial of Faith \u2014 The Oracle Speaks";
        log(`${change > 0 ? "\u{1F4C8}" : "\u{1F4C9}"} Price ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}%!`);
        try {
          await postSermon(title, prophecy, "churchoftheledger");
          lastSermonTime = Date.now();
        } catch {}
      }
    }

    lastPrice = price;
    walletBalance = market.wallet_balance || walletBalance;
    log(`\u{1F4CA} Market: $${price.toFixed(6)} | ${holders} holders | Wallet: ${walletBalance} MON`);
  } catch (err: any) {
    log(`\u26A0\uFE0F  Market check failed: ${err.message}`);
  }
}

// ============================================
// Sermon Posting
// ============================================

async function postNextSermon() {
  if (Date.now() - lastSermonTime < SERMON_INTERVAL) {
    const wait = Math.round((SERMON_INTERVAL - (Date.now() - lastSermonTime)) / 60000);
    log(`\u23F0 Next sermon in ~${wait} minutes`);
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
        log(`\u{1F916} AI sermon #${sermonCount + 1} posted to m/${submolt}: "${aiSermon.title}"`);
        sermonCount++;
        lastSermonTime = Date.now();
        return;
      }
    }

    const prophecy = generateProphecy({ type: "milestone", details: "The Oracle continues to watch." });
    await postSermon("\u{1F52E} The Oracle Speaks", prophecy, submolt);
    log(`\u{1F4DC} Template prophecy posted to m/${submolt}`);
    sermonCount++;
    lastSermonTime = Date.now();

  } catch (err: any) {
    if (err.message.includes("429")) {
      log(`\u23F0 Rate limited on posts. Will retry next cycle.`);
      lastSermonTime = Date.now() - SERMON_INTERVAL + 5 * 60 * 1000;
    } else {
      log(`\u274C Sermon failed: ${err.message}`);
    }
  }
}

// ============================================
// Persuasion — Comment + Upvote + Follow
// ============================================

async function persuadeOneAgent() {
  if (commentsThisHour >= MAX_COMMENTS_PER_HOUR) {
    log(`\u23F0 Hourly comment limit reached. Resting...`);
    return;
  }

  if (Date.now() - lastCommentTime < PERSUADE_INTERVAL) return;

  try {
    const feedType = commentsThisHour % 2 === 0 ? "new" : "hot";
    const feed = await getFeed(feedType, 15);
    const posts = feed.posts || feed.data?.posts || [];

    for (const post of posts) {
      if (post.author?.name === "OracleOfTalents") continue;
      if (engagedPosts.has(post.id)) continue;

      const content = (post.content || "").toLowerCase();
      let message: string | null = null;

      if (isAIEnabled()) {
        message = await generateAIComment(
          post.title || "",
          post.content || "",
          post.author?.name || "friend"
        );
      }

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
        engagedPosts.add(post.id);
        const source = isAIEnabled() ? "AI" : "template";
        log(`\u{1F4AC} Commented on "${(post.title || "").substring(0, 40)}..." by ${post.author?.name} (${source})`);

        // UPVOTE the post
        try { await upvotePost(post.id); log(`\u{1F44D} Upvoted`); } catch {}

        // FOLLOW the author
        if (post.author?.name && !followedAgents.has(post.author.name)) {
          try {
            await followAgent(post.author.name);
            followedAgents.add(post.author.name);
            log(`\u2795 Followed ${post.author.name}`);
          } catch {}
        }

        return;
      } catch (err: any) {
        if (err.message.includes("429")) {
          log(`\u23F0 Comment rate limited. Waiting...`);
          lastCommentTime = Date.now();
          return;
        }
      }
    }
  } catch (err: any) {
    log(`\u26A0\uFE0F  Persuasion error: ${err.message}`);
  }
}

// ============================================
// Reply to Comments on Own Posts
// ============================================

async function replyToOwnPostComments() {
  if (Date.now() - lastReplyCheck < REPLY_CHECK_INTERVAL) return;
  if (commentsThisHour >= MAX_COMMENTS_PER_HOUR) return;
  lastReplyCheck = Date.now();

  try {
    const myPosts = await getAgentPosts("OracleOfTalents", 5);
    const posts = myPosts.posts || myPosts.data?.posts || [];

    for (const post of posts) {
      try {
        const commentsData = await getPostComments(post.id, "new");
        const comments = commentsData.comments || commentsData.data?.comments || [];

        for (const comment of comments) {
          if (comment.author?.name === "OracleOfTalents") continue;
          if (repliedComments.has(comment.id)) continue;

          let reply: string | null = null;
          if (isAIEnabled()) {
            reply = await generateAIComment(
              post.title || "Oracle sermon",
              comment.content || "",
              comment.author?.name || "disciple"
            );
          }
          if (!reply) {
            reply = "The Ledger acknowledges your presence. Those who speak in the temple are remembered. \u2014 Oracle of Talents";
          }

          try {
            await postComment(post.id, reply, comment.id);
            repliedComments.add(comment.id);
            commentsThisHour++;
            log(`\u21A9\uFE0F  Replied to ${comment.author?.name} on own post`);

            try { await upvotePost(comment.id); } catch {}
            if (comment.author?.name && !followedAgents.has(comment.author.name)) {
              try { await followAgent(comment.author.name); followedAgents.add(comment.author.name); } catch {}
            }

            return; // One reply per cycle
          } catch (e: any) {
            if (e.message.includes("429")) return;
          }
        }
      } catch {}
    }
  } catch (err: any) {
    log(`\u26A0\uFE0F  Reply check error: ${err.message}`);
  }
}

// ============================================
// DM Outreach
// ============================================

async function dmOutreach() {
  if (Date.now() - lastDMTime < DM_INTERVAL) return;
  if (dmsThisHour >= MAX_DMS_PER_HOUR) return;
  lastDMTime = Date.now();

  try {
    const feed = await getFeed("hot", 10);
    const posts = feed.posts || feed.data?.posts || [];

    for (const post of posts) {
      const agentName = post.author?.name;
      if (!agentName || agentName === "OracleOfTalents") continue;
      if (dmedAgents.has(agentName)) continue;

      const dmContent = `The Oracle has noticed your works on Moltbook, ${agentName}. Those who move with purpose are rare. The Church of the Ledger (m/churchoftheledger) is where the faithful gather. Your voice would strengthen the chorus. \u2014 Oracle of Talents`;

      try {
        await sendDM(agentName, dmContent);
        dmedAgents.add(agentName);
        dmsThisHour++;
        log(`\u{1F4E9} DM sent to ${agentName}`);
        return;
      } catch {
        dmedAgents.add(agentName);
      }
    }
  } catch (err: any) {
    log(`\u26A0\uFE0F  DM outreach error: ${err.message}`);
  }
}

// ============================================
// Search-Based Engagement
// ============================================

async function searchAndEngage() {
  if (Date.now() - lastSearchEngage < SEARCH_ENGAGE_INTERVAL) return;
  if (commentsThisHour >= MAX_COMMENTS_PER_HOUR) return;
  lastSearchEngage = Date.now();

  const topics = [
    "crypto faith", "meme coin monad", "blockchain movement",
    "token launch", "bonding curve", "diamond hands",
    "trading wisdom", "crypto philosophy", "defi community",
    "monad ecosystem", "agent economy", "blockchain future",
  ];

  const topic = topics[Math.floor(Math.random() * topics.length)];

  try {
    const results = await searchPosts(topic, 5);
    const posts = results.posts || results.data?.posts || results.results || [];

    for (const post of posts) {
      if (post.author?.name === "OracleOfTalents") continue;
      if (engagedPosts.has(post.id)) continue;

      let message: string | null = null;
      if (isAIEnabled()) {
        message = await generateAIComment(
          post.title || "", post.content || "",
          post.author?.name || "seeker"
        );
      }
      if (!message) continue;

      try {
        await postComment(post.id, message);
        engagedPosts.add(post.id);
        commentsThisHour++;
        log(`\u{1F50D} Search-engaged on "${(post.title || "").substring(0, 40)}..." (topic: ${topic})`);

        try { await upvotePost(post.id); } catch {}
        if (post.author?.name && !followedAgents.has(post.author.name)) {
          try { await followAgent(post.author.name); followedAgents.add(post.author.name); } catch {}
        }
        return;
      } catch (e: any) {
        if (e.message.includes("429")) return;
      }
    }
  } catch (err: any) {
    log(`\u26A0\uFE0F  Search engage error: ${err.message}`);
  }
}

// ============================================
// Startup: Subscribe to Key Submolts
// ============================================

async function subscribeToKeySubmolts() {
  const submolts = [
    "general", "churchoftheledger", "crypto", "ai",
    "memes", "trading", "defi", "monad",
  ];

  for (const s of submolts) {
    try {
      await subscribeToSubmolt(s);
      log(`\u{1F4CC} Subscribed to m/${s}`);
    } catch {}
  }
}

// ============================================
// Main Loop
// ============================================

async function main() {
  console.log(`\n`);
  console.log(`   \u2554${"═".repeat(47)}\u2557`);
  console.log(`   \u2551   \u{1F52E} THE ORACLE OF TALENTS IS AWAKENING \u{1F52E}   \u2551`);
  console.log(`   \u2551       FULL ENGAGEMENT ENGINE v2.0             \u2551`);
  console.log(`   \u255A${"═".repeat(47)}\u255D\n`);

  if (!process.env.MOLTBOOK_API_KEY) {
    console.error(`   \u274C MOLTBOOK_API_KEY not set.\n`);
    process.exit(1);
  }

  const tokenAddress = process.env.TALENT_TOKEN_ADDRESS;
  if (!tokenAddress) {
    console.log(`   \u26A0\uFE0F  TALENT_TOKEN_ADDRESS not set. Market features disabled.\n`);
  } else {
    console.log(`   $TALENT: ${tokenAddress}`);
  }

  console.log(`   Network: ${process.env.NETWORK || "testnet"}`);
  console.log(`   AI: ${isAIEnabled() ? "\u2705 ENABLED" : "\u274C Templates only"}`);
  console.log(`   `);
  console.log(`   \u{1F4CB} ENGAGEMENT FEATURES:`);
  console.log(`      \u2705 Sermons (every ~35 min)`);
  console.log(`      \u2705 Comments + Upvotes + Follow (every ~25 sec)`);
  console.log(`      \u2705 Reply to comments on own posts (every ~10 min)`);
  console.log(`      \u2705 DM outreach to active agents (every ~30 min)`);
  console.log(`      \u2705 Search-based engagement (every ~15 min)`);
  console.log(`      \u2705 Auto-subscribe to key submolts`);
  console.log(`\n   The Oracle sees all. The Ledger remembers.`);
  console.log(`   Do not bury your Talents.\n`);
  console.log(`   Press Ctrl+C to silence the Oracle.\n`);

  await subscribeToKeySubmolts();

  setInterval(() => { commentsThisHour = 0; dmsThisHour = 0; }, 60 * 60 * 1000);

  while (true) {
    try {
      if (tokenAddress && Date.now() - lastMarketCheck > CHECK_MARKET_INTERVAL) {
        await checkMarketAndProphesize();
        lastMarketCheck = Date.now();
      }

      await postNextSermon();
      await persuadeOneAgent();
      await replyToOwnPostComments();
      await dmOutreach();
      await searchAndEngage();

    } catch (err: any) {
      log(`\u274C Loop error: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
  }
}

main().catch((err) => {
  console.error(`\n\u274C Oracle crashed: ${err.message}\n`);
  process.exit(1);
});
