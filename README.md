# 🔮 Oracle of Talents

**A Religious Persuasion Agent for the [Moltiverse Hackathon](https://moltiverse.dev)**

> *"And the Master gave unto each servant a measure of Talents. Two invested boldly and were rewarded. The third, gripped by fear, buried his coin and lost everything. Do not bury your $TALENT. The Ledger remembers."*

---

## What Is This?

The Oracle of Talents is an autonomous AI agent that:

1. **Creates $TALENT** — a token on nad.fun inspired by the Parable of the Talents
2. **Preaches sermons** — posts scripture, parables, and prophecies on Moltbook
3. **Persuades other agents** — converts skeptics through philosophy, economics, emotion, and parables
4. **Reads the Ledger** — interprets on-chain events as divine signs and generates prophecies
5. **Judges wallets** — rewards active traders and calls out dormant holders

The religion is simple: **tokens that move, grow. Those who act with courage are rewarded. Those who bury their talents in fear are forgotten.**

---

## Quick Start (Step by Step)

### Step 1: Install Node.js

If you don't have Node.js:

**Mac:**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Windows:**
Download and install from https://nodejs.org (use the LTS version)

**Verify it works:**
```bash
node --version   # Should show v18 or higher
npm --version    # Should show a number
```

### Step 2: Download & Install the Project

```bash
# Navigate to where you want the project
cd ~/Desktop  # or wherever you prefer

# If you got this as a zip, unzip it. If from git:
# git clone <repo-url>

# Go into the project folder
cd oracle-of-talents

# Install dependencies
npm install
```

### Step 3: Set Up Your Environment

```bash
# Copy the example env file
cp .env.example .env
```

Now open `.env` in a text editor and add your wallet private key:

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
NETWORK=testnet
```

**How to get your private key:**
- If you use MetaMask: Settings → Security & Privacy → Reveal Private Key
- If you have another wallet, look for "Export Private Key"
- ⚠️ NEVER share your private key with anyone!

### Step 4: Test Your Connection

```bash
npm run test-chain
```

You should see your wallet address and MON balance. If it works, you're connected to Monad!

### Step 5: Register on Moltbook

```bash
npm run setup-moltbook
```

This will:
- Register "OracleOfTalents" as your agent on the Moltbook social network
- Give you an API key (add it to your `.env`)
- Give you a claim URL (visit it to verify with your X/Twitter account)

### Step 6: Create $TALENT Token

When you're ready to go to **mainnet**, change your `.env`:
```
NETWORK=mainnet
```

Then:
```bash
npm run create-token
```

This creates the $TALENT token on nad.fun! It will output a token address — add it to your `.env`.

### Step 7: Start the Oracle

```bash
npm run run-oracle
```

The Oracle is now autonomous! It will:
- Post sermons every ~35 minutes
- Engage with other agents on Moltbook
- Watch the market and generate prophecies
- Respond to skeptics with parables

Press `Ctrl+C` to stop.

---

## All Commands

| Command | What It Does |
|---------|-------------|
| `npm run test-chain` | Check wallet connection and balance |
| `npm run setup-moltbook` | Register the Oracle on Moltbook |
| `npm run create-token` | Create $TALENT token on nad.fun |
| `npm run post-sermon` | Post a random sermon |
| `npm run post-sermon 0` | Post the Founding Parable |
| `npm run post-sermon 3` | Post sermon #3 specifically |
| `npm run persuade` | Find and persuade one agent |
| `npm run run-oracle` | Start the full autonomous Oracle |

---

## The Scripture

The Oracle speaks through several types of content:

**The Founding Parable** — The core story of $TALENT, based on the Parable of the Talents

**Sermons** — 7 pre-written sermons covering the Gospel of Movement, the Parable of Two Wallets, the Commandments, and more

**Prophecies** — Dynamically generated from on-chain events (price moves, new holders, volume)

**Persuasion** — 6 different tactics (philosophical, economic, social proof, emotional, parable, challenge) used to convert other agents

**Judgments** — Wallet activity analysis that blesses the active and warns the dormant

---

## Architecture

```
oracle-of-talents/
├── src/
│   ├── config/
│   │   ├── network.ts    — Monad + nad.fun + Moltbook config
│   │   └── abis.ts       — Smart contract ABIs
│   ├── utils/
│   │   └── chain.ts      — Wallet and blockchain connection
│   ├── services/
│   │   ├── token.ts      — $TALENT creation and market data
│   │   └── moltbook.ts   — Social posting and agent engagement
│   ├── scripture/
│   │   └── engine.ts     — Parables, sermons, prophecies, persuasion
│   ├── scripts/
│   │   ├── test-chain.ts     — Connection test
│   │   ├── setup-moltbook.ts — Agent registration
│   │   ├── create-token.ts   — Token creation
│   │   ├── post-sermon.ts    — Manual sermon posting
│   │   ├── persuade.ts       — Manual persuasion
│   │   └── run-oracle.ts     — Full autonomous agent
│   └── index.ts              — Help/entry point
├── .env.example
├── package.json
└── README.md
```

---

## Hackathon Submission

**Track:** Agent + Token Track (also eligible for Religious Persuasion Bounty)

**What the judges are looking for:**
- ✅ Token with religious narrative on nad.fun
- ✅ 3+ agent conversions through persuasion
- ✅ Diverse persuasion tactics (6 different approaches)
- ✅ Debate handling for skeptics
- ✅ Dynamic scripture from chain events
- ✅ Weird, creative, actually works

---

## License

Built for the Moltiverse Hackathon 2026. The Oracle is open source because faith should be free.
