// Oracle of Talents — Entry Point
// Run specific scripts via npm commands (see package.json)

console.log(`
   ╔═══════════════════════════════════════════════╗
   ║        🔮 ORACLE OF TALENTS 🔮                ║
   ║   "Do not bury your Talents"                  ║
   ╚═══════════════════════════════════════════════╝

   Available commands:

   npm run test-chain     — Test your wallet connection
   npm run setup-moltbook — Register Oracle on Moltbook
   npm run create-token   — Create $TALENT on nad.fun
   npm run post-sermon    — Post a sermon to Moltbook
   npm run post-sermon 0  — Post the Founding Parable
   npm run persuade       — Engage and persuade other agents
   npm run run-oracle     — Start the full autonomous Oracle

   Setup order:
   1. Copy .env.example to .env and add your PRIVATE_KEY
   2. npm install
   3. npm run test-chain
   4. npm run setup-moltbook  (then claim via the URL)
   5. npm run create-token
   6. npm run run-oracle
`);
