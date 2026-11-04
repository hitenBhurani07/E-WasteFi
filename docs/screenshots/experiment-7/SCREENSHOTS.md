# Experiment 7 — Screenshots Required

Place your screenshots in this directory and update the table below with filenames.

## Required Screenshots

| # | Filename | Description |
|---|---|---|
| 1 | `01-oracle-ui-overview.png` | Full oracle page showing live ETH/USD price, last update time, and round ID |
| 2 | `02-price-fetched.png` | Price displayed after clicking "Fetch Price" — e.g., "$2,345.67000000" |
| 3 | `03-chainlink-feed-etherscan.png` | Etherscan view of Chainlink ETH/USD aggregator on Sepolia (`0x694AA1...`) |
| 4 | `04-latestRoundData-console.png` | Browser console showing raw `latestRoundData()` response (roundId, answer, timestamps) |
| 5 | `05-decimal-scaling.png` | Console or UI showing raw answer (e.g., 234567000000) divided by 1e8 = price |
| 6 | `06-mock-price-feed-deploy.png` | Terminal showing MockPriceFeed deployment for local testing |
| 7 | `07-mock-price-set.png` | Calling `setPrice()` on MockPriceFeed and UI reflecting the custom price |
| 8 | `08-safe-consumer-staleness.png` | SafeEWastePriceConsumer rejecting stale price (updatedAt too old) |
| 9 | `09-gas-fee-usd.png` | UI showing gas fee conversion: ETH cost × ETH/USD price = USD fee |
| 10 | `10-safe-consumer-deploy.png` | Terminal showing SafeEWastePriceConsumer deployed with Chainlink feed address |
| 11 | `11-round-id-increment.png` | Multiple price fetches showing incrementing roundId |
| 12 | `12-test-output-oracle.png` | Hardhat test results for all Chainlink price feed test cases passing |

## Notes
- Show Chainlink feed address `0x694AA1769357215DE4FAC081bf1f309aDC325306` in Sepolia Etherscan
- Annotate the decimal scaling screenshot clearly (8 decimals for ETH/USD)
- Capture the staleness check revert message for the SafeEWastePriceConsumer demo
- Show both MockPriceFeed (local) and real Chainlink feed (Sepolia) usage
