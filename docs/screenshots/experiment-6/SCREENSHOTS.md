# Experiment 6 — Screenshots Required

Place your screenshots in this directory and update the table below with filenames.

## Required Screenshots

| # | Filename | Description |
|---|---|---|
| 1 | `01-dex-ui-overview.png` | Full DEX page showing token pair, price, and swap interface |
| 2 | `02-factory-deploy.png` | Terminal showing EWasteFactory deployment address |
| 3 | `03-create-pair-tx.png` | MetaMask popup for `createPair(EWASTE, EREWARD)` via Factory |
| 4 | `04-pair-address.png` | Pair contract address returned and displayed after creation |
| 5 | `05-approve-ewaste-tx.png` | MetaMask popup approving EWASTE spend for Router |
| 6 | `06-approve-ereward-tx.png` | MetaMask popup approving EREWARD spend for Router |
| 7 | `07-add-liquidity-router.png` | Router `addLiquidity()` transaction in MetaMask |
| 8 | `08-lp-tokens-minted.png` | LP token balance after first liquidity provision (note MINIMUM_LIQUIDITY=1000 burned) |
| 9 | `09-swap-exact-tokens.png` | DEX swap form — `swapExactTokensForTokens` |
| 10 | `10-swap-tx-dex.png` | MetaMask popup for DEX swap transaction |
| 11 | `11-swap-confirmed-dex.png` | Token balances updated after successful DEX swap |
| 12 | `12-remove-liquidity-router.png` | Router `removeLiquidity()` transaction |
| 13 | `13-etherscan-pair-events.png` | Etherscan showing Swap, Mint, Burn events on the Pair contract |
| 14 | `14-router-path-console.png` | Browser console showing swap path array: `[EWASTE_ADDR, EREWARD_ADDR]` |
| 15 | `15-test-output-dex.png` | Full test suite output for DEX contracts |

## Notes
- Annotate the LP token screenshot to explain the 1000 MINIMUM_LIQUIDITY burned on first deposit
- Show the Factory's `getPair()` function returning the pair address
- Demonstrate `getAmountsOut()` from the Router before swapping
