// ============================================
// Trading Service — The Oracle Puts Its MON Where Its Mouth Is
// ============================================

import { parseEther, encodeFunctionData } from "viem";
import { lensAbi, bondingCurveRouterAbi } from "../config/abis";
import { CONFIG } from "../config/network";

export async function buyTalent(
  publicClient: any,
  walletClient: any,
  account: any,
  chain: any,
  tokenAddress: `0x${string}`,
  monAmount: string = "0.5"
): Promise<string | null> {
  try {
    // 1. Get quote from Lens
    const [router, amountOut] = await publicClient.readContract({
      address: CONFIG.LENS as `0x${string}`,
      abi: lensAbi,
      functionName: "getAmountOut",
      args: [tokenAddress, parseEther(monAmount), true],
    }) as [`0x${string}`, bigint];

    // 2. Calculate slippage (2%)
    const amountOutMin = (amountOut * 98n) / 100n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

    // 3. Encode buy call
    const callData = encodeFunctionData({
      abi: bondingCurveRouterAbi,
      functionName: "buy",
      args: [{
        amountOutMin,
        token: tokenAddress,
        to: account.address,
        deadline,
      }],
    });

    // 4. Send transaction
    const hash = await walletClient.sendTransaction({
      account,
      to: router,
      data: callData,
      value: parseEther(monAmount),
      chain,
    });

    // 5. Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return hash;
  } catch (err: any) {
    throw new Error(`Buy failed: ${err.message}`);
  }
}
