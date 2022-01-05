import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from 'axios';
import { SystemProgram, clusterApiUrl, Keypair, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { config } from './v2_config';
import { read_pwdm, read_config } from './v2_inspector';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const STATE_canceled = 'STATE_canceled'
const STATE_ok = 'OK'

const check_nft_expiration = async (staker_wallet, provider) => {
    let config_dm = await read_config()
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

    // let acc_init = next_account_info(account_iter)?;
    // let acc_pwdm = next_account_info(account_iter)?;
    // let acc_gcdm = next_account_info(account_iter)?;
    // let acc_config = next_account_info(account_iter)?;
    let ixs = [];
    let data = Uint8Array.of(6);
    let keys = [
        { pubkey: host_pubkey, isSigner: true, isWritable: true },
        { pubkey: pwdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(config_dm.gcdm_pubkey), isSigner: false, isWritable: true },
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
    while (!tx.recentBlockhash)
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
    let rtn2 = await axios.post('/api/v2_check_expiration', body);
    return rtn2.data;
}


export const v2_unstake = async (staker_wallet, provider) => {
    try{
        await check_nft_expiration(staker_wallet, provider);
    }catch(err){
        console.log(err);
        return {state:'ERR', msg:'Got NFTs not on due, or the chain crashed'}
    }

    let config_dm = await read_config()
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

    let pubkey_ciety_mint = new PublicKey(config_dm.ciety_mint_pubkey);
    let pubkey_ciety_receiver = await Token.getAssociatedTokenAddress(
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        pubkey_ciety_mint,
        staker_wallet_pubkey
    );
    let pubkey_ciety_pda = await PublicKey.findProgramAddress([Buffer.from(config_dm.seed_pda_ciety), pubkey_ciety_mint.toBuffer()], token_program_pubkey);

    let pwdm = null;

    let ciety_receiver_data = null
    let ins0 = null;
    try {
        pwdm = await read_pwdm(staker_wallet);
    } catch (err) {
        console.log(err)
        return { state: 'ERR', msg:'Maybe the chain is unstable' }
    }
    try {
        ciety_receiver_data = (await connection.getAccountInfo(pubkey_ciety_receiver, 'confirmed')).data
    } catch (err) {
        console.log(err)
    }
    if (!ciety_receiver_data) {
        ins0 = Token.createAssociatedTokenAccountInstruction(
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            pubkey_ciety_mint,
            pubkey_ciety_receiver,
            staker_wallet_pubkey,
            staker_wallet_pubkey,
        );
    }

    let ind_intervals = []
    let ind_start = pwdm.unstake_start
    while(true){
        let ind_end = ind_start + config_dm.unstake_batch_size
        if(ind_end >= pwdm.nft_count){
            ind_intervals.push({start:ind_start, end:pwdm.nft_count})
            break;
        }else{
            ind_intervals.push({start:ind_start, end:ind_end})
            ind_start = ind_end
        }
    }
    let rtn = { state: STATE_ok }
    let created = false
    for (var k = 0; k < ind_intervals.length; k++) {
        let {start, end} = ind_intervals[k]
        let ixs = []
        if(ciety_receiver_data){

        }else{
            if(created){

            }else{
                ixs.push(ins0)
                created = true
            }
        }
        /**
     *      let acc_init = next_account_info(account_iter)?;
            let acc_ciety = next_account_info(account_iter)?;
            let acc_pwdm = next_account_info(account_iter)?;
            let acc_gcdm = next_account_info(account_iter)?;
            let acc_token_prog = next_account_info(account_iter)?;
            let acc_sys_prog = next_account_info(account_iter)?;
            let acc_rent = next_account_info(account_iter)?;
            let acc_config = next_account_info(account_iter)?;
            let acc_staker = next_account_info(account_iter)?;
            let acc_solmate_token_prog = next_account_info(account_iter)?;
            let acc_ciety_receiver = next_account_info(account_iter)?;
            let acc_ciety_mint = next_account_info(account_iter)?;
            let acc_ciety_pda = next_account_info(account_iter)?;
     */
        let data = Uint8Array.of(3);
        let keys = [
            { pubkey: host_pubkey, isSigner: true, isWritable: true },
            { pubkey: new PublicKey(config_dm.ciety_pubkey), isSigner: false, isWritable: true },
            { pubkey: pwdm_pubkey, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(config_dm.gcdm_pubkey), isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: config_pubkey, isSigner: false, isWritable: false },
            { pubkey: staker_wallet_pubkey, isSigner: true, isWritable: false },
            { pubkey: token_program_pubkey, isSigner: false, isWritable: false },
            { pubkey: pubkey_ciety_receiver, isSigner: false, isWritable: true },
            { pubkey: pubkey_ciety_mint, isSigner: false, isWritable: false },
            { pubkey: pubkey_ciety_pda[0], isSigner: false, isWritable: false },
            { pubkey: stake_program_pubkey, isSigner: false, isWritable: false },
        ];

        for (var i = start; i < end; i++) {
            let repeated = pwdm.repeated[i]
            let pubkey_nft_account = new PublicKey(repeated.nft_account);
            let pubkey_nft_mint = new PublicKey(repeated.nft_mint);
            let pubkey_nft_pda = await PublicKey.findProgramAddress([Buffer.from(config_dm.seed_pda_nft), pubkey_nft_mint.toBuffer()], stake_program_pubkey);
            let pubkey_solmate_receiver = await Token.getAssociatedTokenAddress(
                SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                pubkey_nft_mint,
                staker_wallet_pubkey
            );

            keys.push({ pubkey: pubkey_nft_account, isSigner: false, isWritable: true });
            keys.push({ pubkey: pubkey_nft_pda[0], isSigner: false, isWritable: false });
            keys.push({ pubkey: pubkey_nft_mint, isSigner: false, isWritable: false });
            keys.push({ pubkey: pubkey_solmate_receiver, isSigner: false, isWritable: true });
        }

        ixs.push(new TransactionInstruction({
            programId: stake_program_pubkey,
            keys: keys,
            data: Buffer.from(data)
        }));

        const tx = new Transaction().add(...ixs);
        tx.feePayer = staker_wallet_pubkey;
        while (!tx.recentBlockhash)
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
        let rtn2 = await axios.post('/api/v2_unstake', body);
        if( rtn2.data.state != STATE_ok){
            return rtn2.data;
        };
    }
    return rtn;
}