const { SystemProgram, clusterApiUrl, Keypair, Account, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { AccountLayout, Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const BN = require('bn.js');
const fs = require('fs');

const { CONFIG_ACCOUNT_DATA_LAYOUT } = require("./layout");
const { config } = require('./config');
const host_wallet = require('./host_wallet.json');
const buyer3_wallet = require('./buyer3_wallet.json');

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const calc_amount = (amount, percent) => {
    return amount.mul(new BN(Math.round(percent * 10000))).div(new BN(10000));
}

const init = async () => {
    var ixs = [];

    // 1. Resolve the initializer's account from secrets
    const secretKey = Buffer.from(host_wallet);
    const initAccount = Keypair.fromSecretKey(secretKey);
    console.log('host address: ', initAccount.publicKey.toString());
    
    // 2. Create an account for holding all staking states
    const wallet_pubkey = new PublicKey("5uUVcpBbaYJih9EKHYm9awyaYGJJUt1zfcnrk7duCHv7");
    const stake_program_pubkey = new PublicKey(config.stake_program_addr);
    const seed = "per_wallet";
    const span = 10;
    // const [PDA_per_wallet, seed_per_wallet] = await PublicKey.findProgramAddress([Buffer.from(seed), wallet_pubkey.toBuffer()], stake_program_pubkey);
    let per_wallet_keypair = new Keypair();
    let per_wallet_pubkey = per_wallet_keypair.publicKey;
    // ixs.push(SystemProgram.createAccount({
    //     space: config.stake_account_size,
    //     lamports: await connection.getMinimumBalanceForRentExemption(config.stake_account_size, 'singleGossip'),
    //     fromPubkey: initAccount.publicKey,
    //     newAccountPubkey: per_wallet_pubkey,
    //     programId: stake_program_pubkey
    // }));
    
    // /**
    //  * 
    // /** The account that will transfer lamports to the created account */
    // fromPubkey: PublicKey;
    // /** Public key of the created account. Must be pre-calculated with PublicKey.createWithSeed() */
    // newAccountPubkey: PublicKey;
    // /** Base public key to use to derive the address of the created account. Must be the same as the base key used to create `newAccountPubkey` */
    // basePubkey: PublicKey;
    // /** Seed to use to derive the address of the created account. Must be the same as the seed used to create `newAccountPubkey` */
    // seed: string;
    // /** Amount of lamports to transfer to the created account */
    // lamports: number;
    // /** Amount of space in bytes to allocate to the created account */
    // space: number;
    // /** Public key of the program to assign as the owner of the created account */
    // programId: PublicKey;
    //  **/
    const secretKey_buyer3 = Buffer.from(buyer3_wallet);
    const buyer3_account = Keypair.fromSecretKey(secretKey_buyer3);
    const PDA_per_wallet = await PublicKey.createWithSeed(
        wallet_pubkey,
        seed,
        stake_program_pubkey,);
    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: PDA_per_wallet,
        basePubkey: wallet_pubkey,
        seed: seed,
        lamports: await connection.getMinimumBalanceForRentExemption(span, 'singleGossip'),
        space: span,
        programId: stake_program_pubkey
    }));

    console.log('PDA_per_wallet: ' + PDA_per_wallet.toString());

    let data = Uint8Array.of(3,
        ...new BN(33).toArray("le", 1));

    let keys = [
        { pubkey: initAccount.publicKey, isSigner: true, isWritable: false },
        { pubkey: per_wallet_pubkey, isSigner: false, isWritable: false },
        { pubkey: PDA_per_wallet, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    // ixs.push(new TransactionInstruction({
    //     programId: token_program_pubkey,
    //     keys: keys,
    //     data: Buffer.from(data)
    // }));


    const tx = new Transaction().add(...ixs);
    tx.feePayer = initAccount.publicKey;
    tx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    console.log('1111111111111111');
    
    await connection.sendTransaction(tx, [initAccount, buyer3_account], { skipPreflight: false, preflightCommitment: 'confirmed' });
    console.log('22222222222222222');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // const encodedConfigAccountState = (await connection.getAccountInfo(config_pubkey, 'confirmed')).data;
    // const decodedConfigAccountState = CONFIG_ACCOUNT_DATA_LAYOUT.decode(encodedConfigAccountState);
    // console.log('decodedConfigAccountState===', decodedConfigAccountState);
    // console.log('init_timestamp===', new BN(decodedConfigAccountState.init_timestamp, 10, "le").toNumber());
    // console.log('init_pubkey===', new PublicKey(decodedConfigAccountState.init_pubkey).toString());

}

init().then(a => {

});