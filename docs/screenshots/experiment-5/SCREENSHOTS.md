# Experiment 5 — Screenshots Required

Place your screenshots in this directory and update the table below with filenames.

## Required Screenshots

| # | Filename | Description |
|---|---|---|
| 1 | `01-farm-ui-overview.png` | Full farming page showing stake balance, earned rewards, and staking controls |
| 2 | `02-approve-stake-token.png` | MetaMask popup approving EWR token spend for the farm contract |
| 3 | `03-stake-form.png` | Stake form with EWR amount entered (e.g., 500 EWR) |
| 4 | `04-stake-tx.png` | MetaMask popup for `stake()` transaction |
| 5 | `05-stake-confirmed.png` | Stake balance shown as updated — staked EWR visible |
| 6 | `06-rewards-accruing.png` | Frontend showing earned RWR rewards accumulating over time |
| 7 | `07-harvest-tx.png` | MetaMask popup for `harvest()` transaction |
| 8 | `08-harvest-confirmed.png` | RWR reward token balance after successful harvest |
| 9 | `09-partial-unstake.png` | Partial unstake — withdrawing a portion of staked EWR |
| 10 | `10-full-exit-tx.png` | MetaMask popup for full exit (unstake all + harvest) |
| 11 | `11-reward-formula-console.png` | Browser console showing reward calculation: `stakedAmount * rewardRate * elapsedTime / totalStaked` |
| 12 | `12-multiple-stakers.png` | Demonstration of multiple stakers (using different MetaMask accounts or Hardhat accounts) |
| 13 | `13-deploy-output.png` | Terminal showing SimpleYieldFarm deployment output |
| 14 | `14-time-advance-test.png` | Test output showing `evm_increaseTime` used to simulate elapsed time |

## Notes
- Use browser console to log reward amounts at multiple time points
- Demonstrate with two different accounts if possible to show proportional reward sharing
- Show that rewards stop accruing after unstaking
