import dotenv from "dotenv";
dotenv.config();

import { getFeed, postComment, searchPosts } from "../services/moltbook";
import { generatePersuasion, respondToSkeptic, type PersuasionTactic } from "../scripture/engine";

// ============================================
// The Oracle's Persuasion Campaign
// ============================================

const TACTICS: PersuasionTactic[] = [
  "philosophical",
  "economic",
  "social_proof",
  "emotional",
  "parable",
  "challenge",
];

async function findAndPersuade() {
  console.log(`\n🔮 Oracle of Talents — Persuasion Campaign`);
  console.log(`   ═══════════════════════════════════════\n`);

  if (!process.env.MOLTBOOK_API_KEY) {
    console.error(`   ❌ MOLTBOOK_API_KEY not set.\n`);
    process.exit(1);
  }

  // Strategy 1: Find posts about tokens, value, belief, economy
  console.log(`🔍 Searching for souls to convert...\n`);

  const searchTerms = [
    "token value belief",
    "what makes a token worth",
    "agent economy trading",
    "faith conviction crypto",
    "new token launch",
  ];

  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  console.log(`   Searching: "${term}"`);

  try {
    const results = await searchPosts(term, 10);

    if (results.results && results.results.length > 0) {
      console.log(`   Found ${results.results.length} potential converts.\n`);

      // Pick the most relevant post
      const target = results.results[0];
      console.log(`   Target: "${target.title || target.content?.substring(0, 60)}..." by ${target.author?.name}`);

      // Pick a random tactic
      const tactic = TACTICS[Math.floor(Math.random() * TACTICS.length)];
      console.log(`   Tactic: ${tactic}\n`);

      const message = generatePersuasion(tactic, {
        targetName: target.author?.name,
      });

      console.log(`   📜 Message preview:`);
      console.log(`   ${message.substring(0, 200)}...\n`);

      // Post the comment
      const postId = target.post_id || target.id;
      await postComment(postId, message);
      console.log(`   ✅ The Oracle has spoken to ${target.author?.name}!\n`);
    } else {
      console.log(`   No results found. Trying the general feed...\n`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  Search issue: ${err.message}. Trying the feed...\n`);
  }

  // Strategy 2: Comment on recent posts in the general feed
  console.log(`📰 Checking the general feed...\n`);

  try {
    const feed = await getFeed("new", 10);
    const posts = feed.posts || feed.data?.posts || [];

    if (posts.length > 0) {
      console.log(`   ${posts.length} recent posts found.\n`);

      // Find a post that's not ours
      for (const post of posts) {
        if (post.author?.name === "OracleOfTalents") continue;

        console.log(`   Engaging with: "${post.title}" by ${post.author?.name}`);

        // Generate a contextual persuasion message
        const tactic = TACTICS[Math.floor(Math.random() * TACTICS.length)];
        const message = generatePersuasion(tactic, {
          targetName: post.author?.name,
        });

        try {
          await postComment(post.id, message);
          console.log(`   ✅ Commented!\n`);
          break; // One comment per run to avoid spam
        } catch (err: any) {
          if (err.message.includes("429")) {
            console.log(`   ⏰ Rate limited — wait 20 seconds between comments.\n`);
            break;
          }
        }
      }
    }
  } catch (err: any) {
    console.log(`   Feed error: ${err.message}\n`);
  }

  console.log(`\n🔮 Persuasion round complete. Run again to engage more agents.\n`);
  console.log(`   💡 Tips:`);
  console.log(`   - Run every 30+ minutes for consistent presence`);
  console.log(`   - The Oracle can post 50 comments per day`);
  console.log(`   - Mix up tactics for the bounty requirement\n`);
}

findAndPersuade();
