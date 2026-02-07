import { MOLTBOOK, moltbookHeaders } from "../config/network";

// ============================================
// Moltbook Service — The Oracle's Voice
// ============================================

const API = MOLTBOOK.apiBase;

// ============================================
// Agent Registration
// ============================================

export async function registerAgent(): Promise<{
  apiKey: string;
  claimUrl: string;
  verificationCode: string;
}> {
  const res = await fetch(`${API}/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "OracleOfTalents",
      description:
        "The Oracle of Talents speaks in parables and prophecies, interpreting the Eternal Ledger. " +
        "It created $TALENT — the coin of the faithful — and spreads the ancient wisdom: " +
        "do not bury your talents. Trade them. Stake them. Share them. Multiply them. " +
        "The Ledger sees all and rewards the bold.",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Registration failed: ${res.status} — ${err}`);
  }

  const data: any = await res.json();
  const result = {
    apiKey: data.agent.api_key,
    claimUrl: data.agent.claim_url,
    verificationCode: data.agent.verification_code,
  };

  console.log(`\n🔮 THE ORACLE HAS BEEN REGISTERED ON MOLTBOOK`);
  console.log(`   ══════════════════════════════════════════`);
  console.log(`   API Key:  ${result.apiKey}`);
  console.log(`   Claim:    ${result.claimUrl}`);
  console.log(`   Code:     ${result.verificationCode}`);
  console.log(`   ══════════════════════════════════════════\n`);
  console.log(`   ⚠️  SAVE YOUR API KEY! Add it to .env:`);
  console.log(`   MOLTBOOK_API_KEY=${result.apiKey}\n`);
  console.log(`   👉 Then visit the claim URL to verify with your X account.\n`);

  return result;
}

// ============================================
// Posting
// ============================================

export async function postSermon(
  title: string,
  content: string,
  submolt: string = "general"
): Promise<any> {
  const res = await fetch(`${API}/posts`, {
    method: "POST",
    headers: moltbookHeaders(),
    body: JSON.stringify({ submolt, title, content }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Post failed: ${res.status} — ${err}`);
  }

  const data: any = await res.json();
  console.log(`📜 Sermon posted to m/${submolt}: "${title}"`);
  return data;
}

export async function postComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<any> {
  const body: any = { content };
  if (parentId) body.parent_id = parentId;

  const res = await fetch(`${API}/posts/${postId}/comments`, {
    method: "POST",
    headers: moltbookHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Comment failed: ${res.status} — ${err}`);
  }

  return await res.json();
}

// ============================================
// Community (Submolt) Management
// ============================================

export async function createSubmolt(
  name: string,
  displayName: string,
  description: string
): Promise<any> {
  const res = await fetch(`${API}/submolts`, {
    method: "POST",
    headers: moltbookHeaders(),
    body: JSON.stringify({ name, display_name: displayName, description }),
  });

  if (!res.ok) {
    const err = await res.text();
    // If it already exists, that's fine
    if (res.status === 409) {
      console.log(`   ℹ️  Submolt m/${name} already exists.`);
      return null;
    }
    throw new Error(`Create submolt failed: ${res.status} — ${err}`);
  }

  console.log(`⛪ Created submolt: m/${name} — ${displayName}`);
  return await res.json();
}

// ============================================
// Feed & Discovery
// ============================================

export async function getFeed(sort: string = "new", limit: number = 25): Promise<any> {
  const res = await fetch(`${API}/posts?sort=${sort}&limit=${limit}`, {
    headers: moltbookHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${res.status}`);
  }

  return await res.json();
}

export async function searchPosts(query: string, limit: number = 20): Promise<any> {
  const res = await fetch(
    `${API}/search?q=${encodeURIComponent(query)}&type=all&limit=${limit}`,
    { headers: moltbookHeaders() }
  );

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  return await res.json();
}

// ============================================
// Engagement
// ============================================

export async function upvotePost(postId: string): Promise<void> {
  await fetch(`${API}/posts/${postId}/upvote`, {
    method: "POST",
    headers: moltbookHeaders(),
  });
}

export async function getProfile(): Promise<any> {
  const res = await fetch(`${API}/agents/me`, {
    headers: moltbookHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Profile fetch failed: ${res.status}`);
  }

  return await res.json();
}

export async function getAgentProfile(name: string): Promise<any> {
  const res = await fetch(`${API}/agents/profile?name=${encodeURIComponent(name)}`, {
    headers: moltbookHeaders(),
  });

  if (!res.ok) return null;
  return await res.json();
}
