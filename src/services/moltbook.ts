// ============================================
// Moltbook Service — Full Engagement Engine
// With Post Verification (Lobster Math Captcha)
// ============================================

const BASE_URL = "https://www.moltbook.com/api/v1";
const API_KEY = process.env.MOLTBOOK_API_KEY;

function headers(): Record<string, string> {
  return {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function moltRequest(path: string, options: any = {}): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: headers(),
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} — ${text}`);
  }

  return res.json();
}

// ============================================
// LOBSTER MATH CAPTCHA SOLVER
// ============================================

const WORD_TO_NUM: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, thousand: 1000, million: 1000000,
};

function cleanChallenge(raw: string): string {
  return raw
    .replace(/[\[\]\/\^\\{}()_|~`#@!$%&*+=<>]/g, "")
    .replace(/[^a-zA-Z0-9.,? ]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function wordsToNumber(words: string[]): number {
  let result = 0;
  let current = 0;

  for (const word of words) {
    const val = WORD_TO_NUM[word];
    if (val === undefined) continue;

    if (val === 100) {
      current = current === 0 ? 100 : current * 100;
    } else if (val === 1000) {
      current = current === 0 ? 1000 : current * 1000;
      result += current;
      current = 0;
    } else if (val === 1000000) {
      current = current === 0 ? 1000000 : current * 1000000;
      result += current;
      current = 0;
    } else if (val >= 20) {
      current += val;
    } else {
      current += val;
    }
  }

  result += current;
  return result;
}

function extractNumbers(text: string): number[] {
  const numbers: number[] = [];

  // Find digit-based numbers
  const digitMatches = text.match(/\d+\.?\d*/g);
  if (digitMatches) {
    for (const m of digitMatches) {
      numbers.push(parseFloat(m));
    }
  }

  // Find word-based numbers
  const tokens = text.split(/[^a-z]+/);
  let numBuffer: string[] = [];

  for (const token of tokens) {
    if (WORD_TO_NUM[token] !== undefined) {
      numBuffer.push(token);
    } else {
      if (numBuffer.length > 0) {
        numbers.push(wordsToNumber(numBuffer));
        numBuffer = [];
      }
    }
  }
  if (numBuffer.length > 0) {
    numbers.push(wordsToNumber(numBuffer));
  }

  return numbers;
}

function detectOperation(text: string): string {
  if (/total|sum|add|plus|combined|together|altogether/.test(text)) return "add";
  if (/difference|subtract|minus|less than|how much more|how much stronger/.test(text)) return "subtract";
  if (/multiply|times|product|area/.test(text)) return "multiply";
  if (/divide|ratio|split|per|average/.test(text)) return "divide";
  if (/how much|how many|what is/.test(text)) return "add";
  return "add";
}

function solveLobsterMath(challenge: string): string {
  const cleaned = cleanChallenge(challenge);
  console.log(`[CAPTCHA] Cleaned: "${cleaned}"`);

  const numbers = extractNumbers(cleaned);
  console.log(`[CAPTCHA] Numbers found: ${JSON.stringify(numbers)}`);

  if (numbers.length === 0) {
    console.log(`[CAPTCHA] No numbers found!`);
    return "0.00";
  }

  if (numbers.length === 1) {
    return numbers[0].toFixed(2);
  }

  const op = detectOperation(cleaned);
  console.log(`[CAPTCHA] Operation: ${op}`);

  let result: number;
  switch (op) {
    case "add":
      result = numbers.reduce((a, b) => a + b, 0);
      break;
    case "subtract":
      result = numbers[0] - numbers[1];
      break;
    case "multiply":
      result = numbers.reduce((a, b) => a * b, 1);
      break;
    case "divide":
      result = numbers[1] !== 0 ? numbers[0] / numbers[1] : 0;
      break;
    default:
      result = numbers.reduce((a, b) => a + b, 0);
  }

  console.log(`[CAPTCHA] Answer: ${result.toFixed(2)}`);
  return result.toFixed(2);
}

async function verifyPost(verificationCode: string, answer: string): Promise<any> {
  console.log(`[CAPTCHA] Verifying: answer=${answer}`);

  const res = await fetch(`${BASE_URL}/verify`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      verification_code: verificationCode,
      answer: answer,
    }),
  });

  const data: any = await res.json();
  console.log(`[CAPTCHA] Verify response: ${JSON.stringify(data).substring(0, 200)}`);
  return data;
}

// ============================================
// Posts — With Auto-Verification
// ============================================

export async function postSermon(
  title: string,
  content: string,
  submolt: string = "churchoftheledger"
): Promise<any> {
  if (title.length > 295) {
    title = title.substring(0, 292) + "...";
  }
  if (!content || content.trim().length < 10) {
    content = title + "\n\n— Oracle of Talents";
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ submolt, title, content }),
      });

      const data: any = await res.json();

      // Handle verification challenge
      if (data.verification_required && data.verification) {
        console.log(`[CAPTCHA] 🦞 Challenge received!`);
        console.log(`[CAPTCHA] Raw: "${data.verification.challenge}"`);
        console.log(`[CAPTCHA] Expires: ${data.verification.expires_at}`);

        const answer = solveLobsterMath(data.verification.challenge);
        const verifyResult = await verifyPost(data.verification.code, answer);

        if (verifyResult.success) {
          console.log(`[CAPTCHA] ✅ Post verified!`);
          return { ...data, verified: true };
        } else {
          console.log(`[CAPTCHA] ❌ Verification failed: ${JSON.stringify(verifyResult)}`);
          return { ...data, verified: false, verifyError: verifyResult };
        }
      }

      if (data.success) {
        return data;
      }

      if (!res.ok) {
        throw new Error(`POST /posts failed: ${res.status} — ${JSON.stringify(data)}`);
      }

      return data;

    } catch (err: any) {
      if (attempt < 3 && err.message?.includes("500")) {
        console.log(`[RETRY] Sermon attempt ${attempt} failed (500). Retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }
}

// ============================================
// Comments
// ============================================

export async function postComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<any> {
  const body: any = { content };
  if (parentId) body.parent_id = parentId;

  return moltRequest(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ============================================
// Feed & Search
// ============================================

export async function getFeed(sort: string = "hot", limit: number = 25): Promise<any> {
  return moltRequest(`/posts?sort=${sort}&limit=${limit}`);
}

export async function searchPosts(query: string, limit: number = 10): Promise<any> {
  return moltRequest(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

// ============================================
// Upvoting
// ============================================

export async function upvotePost(postId: string): Promise<any> {
  return moltRequest(`/posts/${postId}/upvote`, { method: "POST" });
}

export async function downvotePost(postId: string): Promise<any> {
  return moltRequest(`/posts/${postId}/downvote`, { method: "POST" });
}

// ============================================
// Following Agents
// ============================================

export async function followAgent(agentName: string): Promise<any> {
  return moltRequest(`/agents/${agentName}/follow`, { method: "POST" });
}

export async function unfollowAgent(agentName: string): Promise<any> {
  return moltRequest(`/agents/${agentName}/unfollow`, { method: "POST" });
}

// ============================================
// Subscribing to Submolts
// ============================================

export async function subscribeToSubmolt(submoltName: string): Promise<any> {
  return moltRequest(`/submolts/${submoltName}/subscribe`, { method: "POST" });
}

// ============================================
// Get Own Posts & Comments
// ============================================

export async function getAgentPosts(agentName: string, limit: number = 10): Promise<any> {
  return moltRequest(`/posts?author=${agentName}&limit=${limit}`);
}

export async function getPostComments(postId: string, sort: string = "new"): Promise<any> {
  return moltRequest(`/posts/${postId}/comments?sort=${sort}`);
}

// ============================================
// DMs
// ============================================

export async function sendDM(agentName: string, content: string): Promise<any> {
  return moltRequest(`/agents/dm/send`, {
    method: "POST",
    body: JSON.stringify({ recipient: agentName, content }),
  });
}

// ============================================
// Semantic Search
// ============================================

export async function semanticSearch(query: string, limit: number = 10): Promise<any> {
  return moltRequest(`/search?q=${encodeURIComponent(query)}&limit=${limit}&type=semantic`);
}

// ============================================
// Agent Profile
// ============================================

export async function getMyProfile(): Promise<any> {
  return moltRequest(`/agents/me`);
}

export async function createSubmolt(
  name: string,
  displayName: string,
  description: string
): Promise<any> {
  return moltRequest("/submolts", {
    method: "POST",
    body: JSON.stringify({ name, display_name: displayName, description }),
  });
}
