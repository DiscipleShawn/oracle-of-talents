import { parseEther, decodeEventLog } from "viem";
import { CONFIG, nadHeaders, TOKEN } from "../config/network";
import { curveAbi, bondingCurveRouterAbi, lensAbi, erc20Abi } from "../config/abis";
import { getPublicClient, getWalletClient, getAddress, monadChain } from "../utils/chain";

// ============================================
// Token Image Generation
// ============================================

function generateTokenImage(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1"/>
    </radialGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFF8DC;stop-opacity:0.6"/>
      <stop offset="50%" style="stop-color:#FFD700;stop-opacity:0"/>
      <stop offset="100%" style="stop-color:#FFF8DC;stop-opacity:0.3"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="40" fill="#1a1a2e"/>
  
  <!-- Outer ring -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#FFD700" stroke-width="4" opacity="0.6"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#B8860B" stroke-width="2" opacity="0.4"/>
  
  <!-- Coin body -->
  <circle cx="256" cy="256" r="180" fill="url(#glow)"/>
  <circle cx="256" cy="256" r="180" fill="url(#shine)"/>
  <circle cx="256" cy="256" r="165" fill="none" stroke="#B8860B" stroke-width="3"/>
  
  <!-- Eye of the Oracle -->
  <ellipse cx="256" cy="220" rx="70" ry="45" fill="none" stroke="#1a1a2e" stroke-width="5"/>
  <circle cx="256" cy="220" r="22" fill="#1a1a2e"/>
  <circle cx="256" cy="220" r="10" fill="#FFD700"/>
  
  <!-- Rays from eye -->
  <line x1="256" y1="175" x2="256" y2="145" stroke="#1a1a2e" stroke-width="3" opacity="0.5"/>
  <line x1="290" y1="185" x2="310" y2="160" stroke="#1a1a2e" stroke-width="3" opacity="0.5"/>
  <line x1="222" y1="185" x2="202" y2="160" stroke="#1a1a2e" stroke-width="3" opacity="0.5"/>
  
  <!-- TALENT text -->
  <text x="256" y="310" text-anchor="middle" font-family="serif" font-size="44" font-weight="bold" fill="#1a1a2e" letter-spacing="6">TALENT</text>
  
  <!-- Small text -->
  <text x="256" y="350" text-anchor="middle" font-family="serif" font-size="16" fill="#1a1a2e" opacity="0.7">THE ORACLE SEES ALL</text>
  
  <!-- Stars/dots decoration -->
  <circle cx="256" cy="110" r="4" fill="#FFD700" opacity="0.6"/>
  <circle cx="180" cy="140" r="3" fill="#FFD700" opacity="0.4"/>
  <circle cx="332" cy="140" r="3" fill="#FFD700" opacity="0.4"/>
  <circle cx="140" cy="256" r="3" fill="#FFD700" opacity="0.3"/>
  <circle cx="372" cy="256" r="3" fill="#FFD700" opacity="0.3"/>
</svg>`;

  return Buffer.from(svg);
}

// ============================================
// Token Creation
// ============================================

export async function createTalentToken(initialBuyMon: string = "0.5"): Promise<{
  tokenAddress: string;
  poolAddress: string;
  txHash: string;
}> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const account = getAddress();

  console.log("🔮 The Oracle begins the sacred ritual of token creation...\n");

  // Step 1: Upload image
  console.log("📸 Step 1/4: Uploading the sacred image...");
  const imageBuffer = generateTokenImage();
  const imageRes = await fetch(`${CONFIG.apiUrl}/agent/token/image`, {
    method: "POST",
    headers: {
      "Content-Type": "image/svg+xml",
      ...(process.env.NAD_API_KEY ? { "X-API-Key": process.env.NAD_API_KEY } : {}),
    },
    body: imageBuffer,
  });

  if (!imageRes.ok) {
    const err = await imageRes.text();
    throw new Error(`Image upload failed: ${imageRes.status} — ${err}`);
  }
  const { image_uri } = await imageRes.json() as any;
  console.log(`   ✅ Image uploaded: ${image_uri}\n`);

  // Step 2: Upload metadata
  console.log("📜 Step 2/4: Inscribing the sacred metadata...");
  const metadataRes = await fetch(`${CONFIG.apiUrl}/agent/token/metadata`, {
    method: "POST",
    headers: nadHeaders(),
    body: JSON.stringify({
      image_uri,
      name: TOKEN.name,
      symbol: TOKEN.symbol,
      description: TOKEN.description,
      ...(TOKEN.website ? { website: TOKEN.website } : {}),
      ...(TOKEN.twitter ? { twitter: TOKEN.twitter } : {}),
    }),
  });

  if (!metadataRes.ok) {
    const err = await metadataRes.text();
    throw new Error(`Metadata upload failed: ${metadataRes.status} — ${err}`);
  }
  const { metadata_uri } = await metadataRes.json() as any;
  console.log(`   ✅ Metadata inscribed: ${metadata_uri}\n`);

  // Step 3: Mine salt
  console.log("⛏️  Step 3/4: Mining the sacred salt (vanity address)...");
  const saltRes = await fetch(`${CONFIG.apiUrl}/agent/salt`, {
    method: "POST",
    headers: nadHeaders(),
    body: JSON.stringify({
      creator: account,
      name: TOKEN.name,
      symbol: TOKEN.symbol,
      metadata_uri,
    }),
  });

  if (!saltRes.ok) {
    const err = await saltRes.text();
    throw new Error(`Salt mining failed: ${saltRes.status} — ${err}`);
  }
  const { salt, address: predictedAddress } = await saltRes.json() as any;
  console.log(`   ✅ Salt mined. Predicted address: ${predictedAddress}\n`);

  // Step 4: Create on-chain
  console.log("⛓️  Step 4/4: Creating the token on the Eternal Ledger...");

  // Get deploy fee from contract (now with correct ABI)
  const feeConfig = await publicClient.readContract({
    address: CONFIG.CURVE,
    abi: curveAbi,
    functionName: "feeConfig",
  });
  const deployFeeAmount = feeConfig[0] as bigint;
  console.log(`   Deploy fee: ${(Number(deployFeeAmount) / 1e18).toFixed(4)} MON`);

  // Skip initial buy for simplicity - buy separately after creation
  const initialBuyAmount = 0n;
  const minTokens = 0n;
  console.log(`   Initial buy: none (will buy after creation)`);

  const createArgs = {
    name: TOKEN.name,
    symbol: TOKEN.symbol,
    tokenURI: metadata_uri,
    amountOut: minTokens,
    salt: salt as `0x${string}`,
    actionId: 1,  // uint8, not BigInt
  };

  // Estimate gas
  const estimatedGas = await publicClient.estimateContractGas({
    address: CONFIG.BONDING_CURVE_ROUTER,
    abi: bondingCurveRouterAbi,
    functionName: "create",
    args: [createArgs],
    account,
    value: deployFeeAmount + initialBuyAmount,
  });

  // Send transaction
  const hash = await walletClient.writeContract({
    address: CONFIG.BONDING_CURVE_ROUTER,
    abi: bondingCurveRouterAbi,
    functionName: "create",
    args: [createArgs],
    account: walletClient.account!,
    chain: monadChain,
    value: deployFeeAmount + initialBuyAmount,
    gas: estimatedGas + estimatedGas / 10n, // +10% buffer
  });

  console.log(`   ⏳ Transaction sent: ${hash}`);

  // Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

  // Parse token address from event
  let tokenAddress = "";
  let poolAddress = "";
  for (const log of receipt.logs) {
    try {
      const event = decodeEventLog({
        abi: curveAbi,
        data: log.data,
        topics: log.topics,
      });
      if (event.eventName === "CurveCreate") {
        tokenAddress = (event.args as any).token;
        poolAddress = (event.args as any).pool;
        break;
      }
    } catch {
      // Not the event we're looking for
    }
  }

  if (!tokenAddress) {
    throw new Error("Could not find CurveCreate event in transaction receipt");
  }

  console.log(`\n🎉 ═══════════════════════════════════════════`);
  console.log(`   $TALENT HAS BEEN BORN INTO THE LEDGER`);
  console.log(`   ═══════════════════════════════════════════`);
  console.log(`   Token:  ${tokenAddress}`);
  console.log(`   Pool:   ${poolAddress}`);
  console.log(`   TX:     ${hash}`);
  console.log(`   ═══════════════════════════════════════════\n`);
  console.log(`   👉 Add this to your .env file:`);
  console.log(`   TALENT_TOKEN_ADDRESS=${tokenAddress}\n`);

  return { tokenAddress, poolAddress, txHash: hash };
}

// ============================================
// Token Market Data
// ============================================

export async function getTokenMarketData(tokenAddress: string): Promise<any> {
  const res = await fetch(`${CONFIG.apiUrl}/agent/market/${tokenAddress}`, {
    headers: nadHeaders(),
  });
  if (!res.ok) return null;
  return ((await res.json()) as any).market_info;
}

export async function getTokenHolders(tokenAddress: string): Promise<any> {
  const res = await fetch(`${CONFIG.apiUrl}/agent/swap-history/${tokenAddress}?limit=50`, {
    headers: nadHeaders(),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function getTokenBalance(
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`
): Promise<bigint> {
  const publicClient = getPublicClient();
  return publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress],
  });
}
