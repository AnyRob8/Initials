# Initials Smart Contracs

## Build and Test
- `yarn`
- `yarn compile`
- `yarn test`

## Deploy
Copy :
- `envrc-example.txt` to `.envrc`
- `constants-example.ts` to `constants.ts`

Then :
- `direnv allow .`
- `yarn deploy {mainnet | rinkeby}`
  
## Verify
- `yarn verify {mainnet | rinkeby} {contract-address}`


*** Todo: replace deployement by https://github.com/wighawag/hardhat-deploy ***