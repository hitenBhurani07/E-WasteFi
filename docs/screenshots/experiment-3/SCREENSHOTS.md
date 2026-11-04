# Experiment 3 — Screenshots Required

Place your screenshots in this directory and update the table below with filenames.

## Required Screenshots

| # | Filename | Description |
|---|---|---|
| 1 | `01-vault-ui-overview.png` | Full vault page UI showing asset balance, share balance, deposit/withdraw forms |
| 2 | `02-approve-asset-tx.png` | MetaMask popup for ERC-20 `approve()` transaction (allowing vault to spend tokens) |
| 3 | `03-deposit-form.png` | Deposit form filled with an asset amount (e.g., 100 EWA tokens) |
| 4 | `04-deposit-tx.png` | MetaMask popup for `deposit()` transaction |
| 5 | `05-shares-received.png` | Frontend confirming EWVS shares received after deposit |
| 6 | `06-preview-deposit.png` | Frontend showing `previewDeposit` output — expected shares before confirming |
| 7 | `07-preview-redeem.png` | Frontend showing `previewRedeem` output — expected assets before redeeming |
| 8 | `08-withdraw-form.png` | Withdraw form with an amount entered |
| 9 | `09-withdraw-tx.png` | MetaMask popup for `withdraw()` transaction |
| 10 | `10-assets-returned.png` | Asset balance restored after successful withdrawal |
| 11 | `11-total-assets.png` | Vault `totalAssets()` displayed — increases after deposits |
| 12 | `12-share-price.png` | Computed share price (assets / shares) showing 1:1 at inception |
| 13 | `13-etherscan-vault-events.png` | Etherscan showing `Deposit` and `Withdraw` events on the vault contract |
| 14 | `14-compile-deploy-output.png` | Terminal showing compilation and deployment output for Exp 3 contracts |

## Notes
- Demonstrate both `deposit` (asset amount → shares) and `mint` (share amount → asset debit) if implemented
- Demonstrate both `withdraw` (asset amount) and `redeem` (share amount) paths
- Show EWVS token appearing in MetaMask "Assets" tab after adding token address
