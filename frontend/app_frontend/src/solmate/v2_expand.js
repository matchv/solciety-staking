
import BN from 'bn.js';
import axios from 'axios';
import { SystemProgram, clusterApiUrl, Keypair, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import {config} from './v2_config';
import {read_config} from './v2_inspector';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const STATE_canceled = 'STATE_canceled'

export const v2_expand = async (staker_wallet, time_length, provider) => {
    let config_dm = await read_config()
    let ixs = []
    let stake_program_pubkey = new PublicKey(config.stake_program_addr)
    let token_program_pubkey = new PublicKey(config.token_program_addr)
    let host_pubkey = new PublicKey(config.host_wallet_addr)
    let staker_wallet_pubkey = new PublicKey(staker_wallet)

    const pwdm_pubkey = await PublicKey.createWithSeed(
        staker_wallet_pubkey,
        config_dm.seed_pwdm,
        stake_program_pubkey)

    const config_pubkey = await PublicKey.createWithSeed(
        host_pubkey,
        config.seed_config,
        token_program_pubkey);

    let data = Uint8Array.of(4,
        ...new BN(time_length).toArray("le", 2));
    let keys = [
        { pubkey: host_pubkey, isSigner: true, isWritable: true },
        { pubkey: pwdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(config_dm.gcdm_pubkey), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(config_dm.gsdm_pubkey), isSigner: false, isWritable: true },
        { pubkey: config_pubkey, isSigner: false, isWritable: false },
        { pubkey: token_program_pubkey, isSigner: false, isWritable: false },
    ];

    ixs.push(new TransactionInstruction({
        programId: stake_program_pubkey,
        keys: keys,
        data: Buffer.from(data)
    }));

    const tx = new Transaction().add(...ixs);
    tx.feePayer = staker_wallet_pubkey;
    while(!tx.recentBlockhash)
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

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
    let rtn = await axios.post('/api/v2_expand', body);

    return rtn.data;
}