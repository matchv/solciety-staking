const { SystemProgram, clusterApiUrl, Keypair, Account, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { AccountLayout, Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const BN = require('bn.js');
const fs = require('fs');

const { CONFIG_ACCOUNT_DATA_LAYOUT } = require("./layout");
const { config } = require('./config');
const host_wallet = require('./host_wallet.json');

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const calc_amount = (amount, percent) => {
    return amount.mul(new BN(Math.round(percent * 10000))).div(new BN(10000));
}

const pda_existed = async (pda) => {
    try {
        let data = (await connection.getAccountInfo(pda, 'confirmed')).data
        return true;
    } catch (err) {
        // console.log(err)
        return false;
    }
}

const init = async () => {

    // 1. Resolve the initializer's account from secrets
    const secretKey = Buffer.from(host_wallet);
    const initAccount = Keypair.fromSecretKey(secretKey);
    
    let ixs = [];

    // 6. Create an account for holding config info
    const stake_program_pubkey = new PublicKey(config.stake_program_addr);
    const seed_bytes_only = 'seed_bytes_only_4';
    const span = 319376;
    const PDA_config = await PublicKey.createWithSeed(
        initAccount.publicKey,
        seed_bytes_only,
        stake_program_pubkey);

    // ixs.push(SystemProgram.createAccountWithSeed({
    //     fromPubkey: initAccount.publicKey,
    //     newAccountPubkey: PDA_config,
    //     basePubkey: initAccount.publicKey,
    //     seed: seed_bytes_only,
    //     lamports: await connection.getMinimumBalanceForRentExemption(span, 'singleGossip'),
    //     space: span,
    //     programId: stake_program_pubkey
    // }));

    // 8. Call token smart contract
    let staked_slots = 365;
    let staked_nfts = 7000;
    let data = Uint8Array.of(5,
        ...new BN(staked_slots).toArray("le", 2),
        ...new BN(staked_nfts).toArray("le", 2)
        );

    let keys = [
        { pubkey: initAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: PDA_config, isSigner: false, isWritable: true },
    ];

    ixs.push(new TransactionInstruction({
        programId: stake_program_pubkey,
        keys: keys,
        data: Buffer.from(data)
    }));

    const tx = new Transaction().add(...ixs);
    tx.feePayer = initAccount.publicKey;
    tx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    await connection.sendTransaction(tx, [initAccount], { skipPreflight: false, preflightCommitment: 'confirmed' });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const encoded = (await connection.getAccountInfo(PDA_config, 'confirmed')).data;
    
    var cnt = 0;
    var ind = 1;
    // while(cnt < staked_slots){
    //     let dv = new DataView(encoded.buffer, ind, 2);
    //     let slot = dv.getUint16(0, true);
    //     console.log('slot========================', slot);

    //     ind = ind + 2;      
    //     dv = new DataView(encoded.buffer, ind, 2);  
    //     let nft_count = dv.getUint16(0, true);
    //     console.log('nft_count========================', nft_count);

    //     ind = ind + 2;
    //     for(var j=0; j<staked_nfts; j++){
    //         dv = new DataView(encoded.buffer, ind, 2);
    //         nft = dv.getUint16(0, true);
    //         console.log(nft);
    //         ind = ind + 2;
    //     }

    //     cnt++;
    // }



    // const decodedConfigAccountState = CONFIG_ACCOUNT_DATA_LAYOUT.decode(encodedConfigAccountState);
    // console.log('decodedConfigAccountState===', decodedConfigAccountState);
    // console.log('init_pubkey===', new PublicKey(decodedConfigAccountState.init_pubkey).toString());

}

init().then(a => {

});