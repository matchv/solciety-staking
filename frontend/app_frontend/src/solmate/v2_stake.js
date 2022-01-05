import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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

export const v2_stake = async (staker_wallet, time_length, nfts = [], provider) => {
    let ixs = []
    let config_dm = await read_config()
    if(nfts.length>config_dm.unstake_batch_size){
        return {state:'ERR', msg:'you cannot stake more than '+config_dm.unstake_batch_size+' NFTs because the trasaction size has a limit.'}
    }
    let stake_program_pubkey = new PublicKey(config.stake_program_addr)
    let token_program_pubkey = new PublicKey(config.token_program_addr)
    let host_pubkey = new PublicKey(config.host_wallet_addr)
    let staker_wallet_pubkey = new PublicKey(staker_wallet)

    // 0. Create a Pwdm account
    const PDA_pwdm = await PublicKey.createWithSeed(
        staker_wallet_pubkey,
        config_dm.seed_pwdm,
        stake_program_pubkey)
    let per_wallet_data = null
    try {
        per_wallet_data = (await connection.getAccountInfo(PDA_pwdm, 'confirmed')).data
    } catch (err) {
    }
    if (!per_wallet_data) {
        ixs.push(SystemProgram.createAccountWithSeed({
            fromPubkey: staker_wallet_pubkey,
            newAccountPubkey: PDA_pwdm,
            basePubkey: staker_wallet_pubkey,
            seed: config_dm.seed_pwdm,
            lamports: await connection.getMinimumBalanceForRentExemption(config_dm.pwdm_size, 'singleGossip'),
            space: config_dm.pwdm_size,
            programId: stake_program_pubkey
        }))
    }

    // 1. Transfer staker's NFT to Stake Program
    let escrowed_pubkeys = [];
    for (var i = 0; i < nfts.length; i++) {
        // const to = await Token.getAssociatedTokenAddress(
        //     SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        //     TOKEN_PROGRAM_ID,
        //     new PublicKey(nfts[i].mint),
        //     host_pubkey
        // );
        // escrowed_pubkeys.push(to);

        // ixs.push(Token.createTransferInstruction(
        //     TOKEN_PROGRAM_ID,
        //     new PublicKey(nfts[i].account),
        //     to,
        //     staker_wallet_pubkey,
        //     [],
        //     1,
        // ));

        escrowed_pubkeys.push(new PublicKey(nfts[i].account))
    }

    // 2. Call Stake Program
    const config_pubkey = await PublicKey.createWithSeed(
        host_pubkey,
        config.seed_config,
        token_program_pubkey);
 
        // let account_iter = &mut accounts.iter();
        // let acc_init = next_account_info(account_iter)?;
        // let acc_pwdm = next_account_info(account_iter)?;
        // let acc_gcdm = next_account_info(account_iter)?;
        // let acc_gsdm = next_account_info(account_iter)?;
        // let acc_token_prog = next_account_info(account_iter)?;
        // let acc_sys_prog = next_account_info(account_iter)?;
        // let acc_rent = next_account_info(account_iter)?;
        // let acc_config = next_account_info(account_iter)?;

    let data = Uint8Array.of(0,
        ...new BN(time_length).toArray("le", 2),
        ...new BN(nfts.length).toArray("le", 2));
    let keys = [
        { pubkey: host_pubkey, isSigner: true, isWritable: true },
        { pubkey: PDA_pwdm, isSigner: false, isWritable: true },
        { pubkey: config_dm.gcdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: config_dm.gsdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: config_pubkey, isSigner: false, isWritable: false },
        { pubkey: staker_wallet_pubkey, isSigner: true, isWritable: false },
        { pubkey: token_program_pubkey, isSigner: false, isWritable: false },
    ];

    for (var i = 0; i < escrowed_pubkeys.length; i++) {
        let nft_acc_pubkey = escrowed_pubkeys[i];
        let nft_mint_pubkey = new PublicKey(nfts[i].mint);
        const PDA = await PublicKey.findProgramAddress([Buffer.from(config_dm.seed_pda_nft), nft_mint_pubkey.toBuffer()], stake_program_pubkey);
        keys.push({ pubkey: nft_acc_pubkey, isSigner: false, isWritable: true })
        keys.push({ pubkey: nft_mint_pubkey, isSigner: false, isWritable: false })
        keys.push({ pubkey: PDA[0], isSigner: false, isWritable: false })
        keys.push({ pubkey: new PublicKey(nfts[i]['mintAuthority']), isSigner: false, isWritable: false })
    }

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
    try{
        signed = await provider.signTransaction(tx);
    }catch(err){
        return { state: STATE_canceled };
    }

    let body = {
        tx_wire: signed.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        })
    };
    let rtn = await axios.post('/api/v2_stake', body);
    return rtn.data;

}