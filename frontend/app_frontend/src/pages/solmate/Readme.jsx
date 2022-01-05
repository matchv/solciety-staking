import React, { useState, useEffect } from 'react'
// import TokenForm from "./TokenForm";
import PageHeader from "../../ap_components/PageHeader";
import PeopleOutlineTwoToneIcon from '@material-ui/icons/PeopleOutlineTwoTone';
import { Paper, makeStyles, TableBody, TableRow, TableCell, CardActions, Card, CardContent, InputAdornment, Typography, Button } from '@material-ui/core';
import ReadmeImg from '../../images/data_model.png';

const useStyles = makeStyles(theme => ({
    pageContent: {
        margin: theme.spacing(5),
        padding: theme.spacing(3)
    },
    searchInput: {
        width: '75%'
    },
    newButton: {
        position: 'absolute',
        right: '10px'
    }
}))

export default function Readme() {
    return (
        <div>
            <Typography variant="h2" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Data Model
            </Typography>
            <img src={ReadmeImg} alt="AP" style={{ marginTop: '20px' }} />
            <Typography variant="h2" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Security & Biz Rules
            </Typography>
            <Typography variant="h5" gutterBottom color='secondary' component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                <ol>
                    <li>When initializing, the on-chain project configuration stores the host wallet key, after that,
                        any calls to the contract will be checked as this:</li>
                    <ul>
                        <li>Assume the first account passed in is the host wallet</li>
                        <li>It must be a signer</li>
                        <li>It must be the same as the one remembered by the on-chain configuration</li>
                        <li>The on-chain configuration must be intialized</li>
                        <li>CONCLUSION: NO ONE CAN ATTACK YOUR CONTRACT AS LONG AS YOUR SECRET DOESN'T LEAK OUT</li>
                    </ul>
                    <li>The contract check if NFTs to be staked are valid by comparing their authority with on-chain pre-configured one</li>
                    <li>max_stake_each_time, stake_min_days, stake_max_days and max_stake_per_wallet are all checked on-chain</li>
                    <li>Both $CIETY and NFTs are locked into the contract, they can't be transfered outside of the contract</li>
                    <li>A staker can't unstake his NFTs if any one NFT is still in its staking period</li>
                </ol>
            </Typography>
            <Typography variant="h2" gutterBottom component="div" style={{ marginTop: '30px', color: '#aaaaff' }}>
                Backend Configuration
            </Typography>
                <pre><code>
    network: 'devnet',<br/>
    stake_program_addr: 'HAoqALFTiyibSRgh63qUWX1sdxt82R3hCqSwAmk8Pysw',<br/>
    token_program_addr: '7Pfq1Lz24RWDrsJxCYaFuw3J9vVwPvcNiPeu38ssLrRo',<br/>
    gsdm_size: GSDM_SIZE,<br/>
    gcdm_size: GCDM_SIZE,<br/>
    rpdm_size: RPDM_SIZE,<br/>
    seed_config: 'seed_config_21',<br/>
    seed_ciety: 'seed_ciety_21',<br/>
    seed_gsdm: 'seed_gsdm_21',<br/>
    seed_gcdm: 'seed_gcdm_21',<br/>
    seed_pwdm: 'seed_pwdm_21',<br/>
    seed_rpdm: 'seed_rpdm_21',<br/>
    
    total_supply: 1000000000,<br/>
    to_community_percent: 0.2,<br/>
    to_community_address: 'AJz6nffDtCBtquZj4gSHMj9YjHDhETZe2RpA2S9Pfqf4',<br/>
    to_team_percent: 0.05,
    to_team_addresses: ['DnUspL6hJpp7edGF2LGt4vSEUwttYxvVR3LtuEHs3QM8', '2qwZumjVu8CCasFHxL31YhzrMwN3ubkM8XzupGxPZ6u1'],<br/>
    to_rewards_percent: 0.75,<br/>

    // below on-chain<br/>
    stake_min_days: 7,<br/>
    stake_max_days: 365,<br/>
    emission_total_days: 365*2,<br/>
    ciety_decimals: 9,<br/>
    start_emission: 100000,<br/>
    decay_frequency_seconds: 60 * 1,<br/>
    total_nfts: TOTAL_NFTS,<br/>
    max_stake_per_wallet: 100,<br/>
    max_stake_each_time: 5,<br/>
    debug: 1,<br/>
    
    nft_author: '9MJzW1oEzvjHnmdLdoGRGr1i4hu82g7eEEnxvmifcDZD',<br/>
                </code></pre>
            
        </div>
    )
}
