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
    var genearted = {};

    // 1. Resolve the initializer's account from secrets
    const secretKey = Buffer.from(host_wallet);
    const initAccount = Keypair.fromSecretKey(secretKey);
    console.log('host address: ', initAccount.publicKey.toString());

    let ixs = [];

    // 2. Create a mint ($CIETY)
    let ciety_mint = await splToken.Token.createMint(
        connection,
        initAccount,
        initAccount.publicKey,
        null,
        config.ciety_decimals,
        splToken.TOKEN_PROGRAM_ID);

    console.log('ciety_mint_addr: ' + ciety_mint.publicKey.toString());
    genearted['ciety_mint_addr'] = ciety_mint.publicKey.toString();

    // 3. Mint to reward vault
    const PDA_ciety = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_ciety,
        splToken.TOKEN_PROGRAM_ID);
    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: PDA_ciety,
        basePubkey: initAccount.publicKey,
        seed: config.seed_ciety,
        lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip'),
        space: AccountLayout.span,
        programId: splToken.TOKEN_PROGRAM_ID
    }));
    ixs.push(Token.createInitAccountInstruction(
        splToken.TOKEN_PROGRAM_ID,
        ciety_mint.publicKey,
        PDA_ciety,
        initAccount.publicKey));

    let amount = new BN(config.total_supply).mul(new BN(10).pow(new BN(config.ciety_decimals)));
    ixs.push(Token.createMintToInstruction(
        splToken.TOKEN_PROGRAM_ID,
        ciety_mint.publicKey,
        PDA_ciety,
        initAccount.publicKey,
        [],
        amount.toArray("ge", 8)
    ));
    console.log('ciety_account_addr: ' + PDA_ciety.toString());
    genearted['ciety_account_addr'] = PDA_ciety.toString();

    // 4. Transfer to community
    let ciety_account_community = await ciety_mint.getOrCreateAssociatedAccountInfo(new PublicKey(config.to_community_address));
    ixs.push(splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        PDA_ciety,
        ciety_account_community.address,
        initAccount.publicKey,
        [],
        calc_amount(amount, config.to_community_percent).toArray("ge", 8),
    ));
    console.log('ciety_account_community address: ' + ciety_account_community.address.toString());

    // 5. Mint to team
    let avg_percent = config.to_team_percent / config.to_team_addresses.length;
    for (var i = 0; i < config.to_team_addresses.length; i++) {
        let addr = config.to_team_addresses[i];
        let ciety_account_team_member = await ciety_mint.getOrCreateAssociatedAccountInfo(new PublicKey(addr));
        ixs.push(splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            PDA_ciety,
            ciety_account_team_member.address,
            initAccount.publicKey,
            [],
            calc_amount(amount, avg_percent).toArray("ge", 8),
        ));
        console.log('ciety_account_team_member address: ' + ciety_account_team_member.address.toString());
    }


    // 6. Create an account for holding config info
    const stake_program_pubkey = new PublicKey(config.stake_program_addr);
    const token_program_pubkey = new PublicKey(config.token_program_addr);
    const PDA_config = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_config,
        stake_program_pubkey);

    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: PDA_config,
        basePubkey: initAccount.publicKey,
        seed: config.seed_config,
        lamports: await connection.getMinimumBalanceForRentExemption(CONFIG_ACCOUNT_DATA_LAYOUT.span, 'singleGossip'),
        space: CONFIG_ACCOUNT_DATA_LAYOUT.span,
        programId: stake_program_pubkey
    }));

    // 7. Create an account for holding all staking states
    const PDA_stake = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_stake,
        stake_program_pubkey);

    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: PDA_stake,
        basePubkey: initAccount.publicKey,
        seed: config.seed_stake,
        lamports: await connection.getMinimumBalanceForRentExemption(config.stake_account_size, 'singleGossip'),
        space: config.stake_account_size,
        programId: stake_program_pubkey
    }));

    // 8. Call token smart contract
    let data = Uint8Array.of(0,
        ...new BN(config.stake_min_days).toArray("le", 2),
        ...new BN(config.stake_max_days).toArray("le", 2),
        ...new BN(config.emission_total_days).toArray("le", 2),
        ...new BN(config.ciety_decimals).toArray("le", 1),
        ...new BN(config.start_emission).toArray("le", 4),
        ...new BN(config.decay_frequency_seconds).toArray("le", 4));
    console.log('data===', data);

    let keys = [
        { pubkey: initAccount.publicKey, isSigner: true, isWritable: false },
        { pubkey: PDA_config, isSigner: false, isWritable: false },
        { pubkey: PDA_ciety, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    ixs.push(new TransactionInstruction({
        programId: token_program_pubkey,
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

    const encodedConfigAccountState = (await connection.getAccountInfo(PDA_config, 'confirmed')).data;
    const decodedConfigAccountState = CONFIG_ACCOUNT_DATA_LAYOUT.decode(encodedConfigAccountState);
    console.log('decodedConfigAccountState===', decodedConfigAccountState);
    console.log('init_pubkey===', new PublicKey(decodedConfigAccountState.init_pubkey).toString());

    fs.writeFileSync('generated.json', JSON.stringify(genearted))
}

init().then(a => {

});