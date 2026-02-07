// ============================================
// Official NadFun ABIs from nad.fun/abi.md
// ============================================

export const lensAbi = [
  {
    type: "function",
    name: "getAmountOut",
    inputs: [
      { name: "_token", type: "address", internalType: "address" },
      { name: "_amountIn", type: "uint256", internalType: "uint256" },
      { name: "_isBuy", type: "bool", internalType: "bool" },
    ],
    outputs: [
      { name: "router", type: "address", internalType: "address" },
      { name: "amountOut", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAmountIn",
    inputs: [
      { name: "_token", type: "address", internalType: "address" },
      { name: "_amountOut", type: "uint256", internalType: "uint256" },
      { name: "_isBuy", type: "bool", internalType: "bool" },
    ],
    outputs: [
      { name: "router", type: "address", internalType: "address" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProgress",
    inputs: [{ name: "_token", type: "address", internalType: "address" }],
    outputs: [{ name: "progress", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInitialBuyAmountOut",
    inputs: [{ name: "amountIn", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isGraduated",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isLocked",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "availableBuyTokens",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [
      { name: "availableBuyToken", type: "uint256", internalType: "uint256" },
      { name: "requiredMonAmount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

export const curveAbi = [
  {
    type: "function",
    name: "curves",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [
      { name: "realMonReserve", type: "uint256", internalType: "uint256" },
      { name: "realTokenReserve", type: "uint256", internalType: "uint256" },
      { name: "virtualMonReserve", type: "uint256", internalType: "uint256" },
      { name: "virtualTokenReserve", type: "uint256", internalType: "uint256" },
      { name: "k", type: "uint256", internalType: "uint256" },
      { name: "targetTokenAmount", type: "uint256", internalType: "uint256" },
      { name: "initVirtualMonReserve", type: "uint256", internalType: "uint256" },
      { name: "initVirtualTokenReserve", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeConfig",
    inputs: [],
    outputs: [
      { name: "deployFeeAmount", type: "uint256", internalType: "uint256" },
      { name: "graduateFeeAmount", type: "uint256", internalType: "uint256" },
      { name: "protocolFee", type: "uint24", internalType: "uint24" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isGraduated",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isLocked",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CurveCreate",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "pool", type: "address", indexed: true, internalType: "address" },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      { name: "symbol", type: "string", indexed: false, internalType: "string" },
      { name: "tokenURI", type: "string", indexed: false, internalType: "string" },
      { name: "virtualMon", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "virtualToken", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "targetTokenAmount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CurveBuy",
    inputs: [
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "amountIn", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "amountOut", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CurveSell",
    inputs: [
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "amountIn", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "amountOut", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;

export const bondingCurveRouterAbi = [
  {
    type: "function",
    name: "create",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct IBondingCurveRouter.TokenCreationParams",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "symbol", type: "string", internalType: "string" },
          { name: "tokenURI", type: "string", internalType: "string" },
          { name: "amountOut", type: "uint256", internalType: "uint256" },
          { name: "salt", type: "bytes32", internalType: "bytes32" },
          { name: "actionId", type: "uint8", internalType: "uint8" },
        ],
      },
    ],
    outputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "pool", type: "address", internalType: "address" },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "buy",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct IBondingCurveRouter.BuyParams",
        components: [
          { name: "amountOutMin", type: "uint256", internalType: "uint256" },
          { name: "token", type: "address", internalType: "address" },
          { name: "to", type: "address", internalType: "address" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "sell",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct IBondingCurveRouter.SellParams",
        components: [
          { name: "amountIn", type: "uint256", internalType: "uint256" },
          { name: "amountOutMin", type: "uint256", internalType: "uint256" },
          { name: "token", type: "address", internalType: "address" },
          { name: "to", type: "address", internalType: "address" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sellPermit",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct IBondingCurveRouter.SellPermitParams",
        components: [
          { name: "amountIn", type: "uint256", internalType: "uint256" },
          { name: "amountOutMin", type: "uint256", internalType: "uint256" },
          { name: "amountAllowance", type: "uint256", internalType: "uint256" },
          { name: "token", type: "address", internalType: "address" },
          { name: "to", type: "address", internalType: "address" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
          { name: "v", type: "uint8", internalType: "uint8" },
          { name: "r", type: "bytes32", internalType: "bytes32" },
          { name: "s", type: "bytes32", internalType: "bytes32" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "DOMAIN_SEPARATOR",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "permit",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "v", type: "uint8", internalType: "uint8" },
      { name: "r", type: "bytes32", internalType: "bytes32" },
      { name: "s", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
