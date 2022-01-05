import {config} from './v2_config';
import axios from 'axios';
import { SystemProgram, clusterApiUrl, Keypair, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import {read_pwdm, read_config} from './v2_inspector';

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);
const STATE_canceled = 'STATE_canceled'

/**
 * Call 'Stake Smart Contract' to calculate his total reward of $CIETY, the contract will store rewards of all NFTs into
 * the staker's account
 * @param {*} staker_wallet 
 * @param {*} provider 
 * @returns 
 */
export const v2_reward = async (staker_wallet, provider) => {
    let ixs = []
    let config_dm = await read_config()
    let stake_program_pubkey = new PublicKey(config.stake_program_addr)
    let token_program_pubkey = new PublicKey(config.token_program_addr)
    let staker_wallet_pubkey = new PublicKey(staker_wallet)
    let host_pubkey = new PublicKey(config.host_wallet_addr)

    const pwdm_pubkey = await PublicKey.createWithSeed(
        staker_wallet_pubkey,
        config_dm.seed_pwdm,
        stake_program_pubkey)        
    
    const config_pubkey = await PublicKey.createWithSeed(
        host_pubkey,
        config.seed_config,
        token_program_pubkey)

        // let acc_init = next_account_info(account_iter)?;
        // let acc_pwdm = next_account_info(account_iter)?;
        // let acc_gcdm = next_account_info(account_iter)?;
        // let acc_config = next_account_info(account_iter)?;
    let keys = [
        { pubkey: host_pubkey, isSigner: true, isWritable: true },
        { pubkey: pwdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(config_dm.gcdm_pubkey), isSigner: false, isWritable: true },
        { pubkey: config_pubkey, isSigner: false, isWritable: false },
        { pubkey: token_program_pubkey, isSigner: false, isWritable: false },
    ]

    let data = Uint8Array.of(2);

    ixs.push(new TransactionInstruction({
        programId: stake_program_pubkey,
        keys: keys,
        data: Buffer.from(data)
    }));

    const tx = new Transaction().add(...ixs);
    tx.feePayer = staker_wallet_pubkey;
    tx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;

    let signed = null;
    try {
        signed = await provider.signTransaction(tx);
    } catch (err) {
        return { state: STATE_canceled };
    }
    
    let body = {
        tx_wire: signed.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        })
    };
    let rtn = await axios.post('/api/v2_stake', body);

    let pwdm = await read_pwdm(staker_wallet);

    return pwdm.ciety;

}
