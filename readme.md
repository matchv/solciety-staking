#1 NFT staking contract on Solana

Per the specs below 

1. Two contracts, stake and token

Staking contract in program_stake folder

Token contract in program_token folder

2. veNFT decays linearly by day, time length between 7 and 365 days, time length is set by staker, this interval is configurable when initializing

3. Emission of $CIETY decays linearly by day, timeength is between 0 and 365*2, this interval is configurable when initializing, the first day emmision is 10000, this is also configurable when initializing

4. A staker can stake multiple Somate NFT at one time

5. Stake contract provides an API for retrieving the total rewards of $CIETY of a staker

6. A staker can only unstake if the lock period has elapsed, otherwise tx will fail, can’t unstake during staking?

7. Start amount of veNFT is determined how many days a staker wants to stake, e.g., staking for 50 days, then start amount is 50/365

8. Given a staked Solmate NFT, in one day, it gets rewards of $CIETY =  emitted_$CIETY_of_this_day * veNFTuser_this_day / veNFTtotal_this_day 

9. Burn when unstake

10. Not necessary for a staker to see their veNFTs and $CIETY in his wallet, just on page

11. Decimals of $CIETY = 9

12. 7K Solmate NFTs in total

13. $CIETY token contract
    a) 1 Billion total supply , configurable
    b) 20% distributed to community treasury, configurable, to one address
    c) 5% distributed to team , configurable, one or more addresses
    d) 75% is emitted in stake lock rewards 
    e) Emission starts at 100000 $CIETY/day and drops to 0 after 2 years. Linear decrease. 
    f) Leftover dust amount can just be left in the contract

14. Q1: No TX during staked, meaning no transferring

15. Q2: Noticed that in section ‘Mining’ below, it mentions ‘staking’ at two places, irrelevant?


#2 CIETY ERC20 token contract on Solana 

Emission and distribution per the above scheme


#4 Backend and Frontend

In their separate folders, a live demo can be found at:

http://178.62.210.47/


#5 Project documentation

In the doc folder, business requirement, solution iterations etc.










