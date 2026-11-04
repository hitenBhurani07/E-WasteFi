# Experiment 4 — Screenshots Required

Place your screenshots in this directory and update the table below with filenames.

## Required Screenshots

| # | Filename | Description |
|---|---|---|
| 1 | `01-amm-ui-overview.png` | Full AMM page showing current reserves (EWT / EWR), LP balance, and swap form |
| 2 | `02-add-liquidity-form.png` | Add Liquidity form with both token amounts entered |
| 3 | `03-approve-token0-tx.png` | MetaMask popup approving EWT spend for the AMM contract |
| 4 | `04-approve-token1-tx.png` | MetaMask popup approving EWR spend for the AMM contract |
| 5 | `05-add-liquidity-tx.png` | MetaMask popup for `addLiquidity()` transaction |
| 6 | `06-lp-tokens-received.png` | LP token balance displayed after adding liquidity |
| 7 | `07-reserves-updated.png` | Reserve display showing updated EWT and EWR amounts after liquidity addition |
| 8 | `08-swap-form.png` | Swap form — entering EWT amount, showing estimated EWR output |
| 9 | `09-price-impact.png` | Price impact percentage displayed for the swap |
| 10 | `10-swap-tx.png` | MetaMask popup for the `swap()` transaction |
| 11 | `11-swap-confirmed.png` | Frontend confirming successful swap — EWR balance increased |
| 12 | `12-remove-liquidity-tx.png` | MetaMask popup for `removeLiquidity()` |
| 13 | `13-tokens-returned.png` | Both EWT and EWR balances restored after removing liquidity |
| 14 | `14-k-value-console.png` | Browser console showing x*y=k constant product verification |
| 15 | `15-deploy-output.png` | Terminal showing AMM deployment output |

## Notes
- Annotate price impact screenshot to explain slippage
- Show k-value (x*y product) before and after swap — it should remain constant (or increase due to fees)
- Demonstrate a large swap to show significant price impact
