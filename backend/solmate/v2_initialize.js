const { SystemProgram, clusterApiUrl, Keypair, Account, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { AccountLayout, Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const BN = require('bn.js');
const fs = require('fs');

const { read_config } = require("./v2_layout");
const { config } = require('./v2_config');
const host_wallet = require('./host_wallet.json');

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const calc_amount = (amount, percent) => {
    return amount.mul(new BN(Math.round(percent * 10000))).div(new BN(10000));
}

const init = async () => {
    var genearted = {};

    // 1. Resolve the initializer's account from secrets
    const secretKey = Buffer.from(host_wallet);
    const initAccount = Keypair.fromSecretKey(secretKey);
    console.log('host_address: ', initAccount.publicKey.toString());
    genearted['host_address'] = initAccount.publicKey.toString();

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
    const stake_program_pubkey = new PublicKey(config.stake_program_addr);
    const token_program_pubkey = new PublicKey(config.token_program_addr);
    const ciety_pubkey = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_ciety,
        splToken.TOKEN_PROGRAM_ID);

    const config_pubkey = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_config,
        token_program_pubkey);

    const gsdm_pubkey = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_gsdm,
        stake_program_pubkey);

    const gcdm_pubkey = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_gcdm,
        stake_program_pubkey);

    const rpdm_pubkey = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_rpdm,
        stake_program_pubkey);

    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: ciety_pubkey,
        basePubkey: initAccount.publicKey,
        seed: config.seed_ciety,
        lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip'),
        space: AccountLayout.span,
        programId: splToken.TOKEN_PROGRAM_ID
    }));

    ixs.push(Token.createInitAccountInstruction(
        splToken.TOKEN_PROGRAM_ID,
        ciety_mint.publicKey,
        ciety_pubkey,
        initAccount.publicKey));

    let amount = new BN(config.total_supply).mul(new BN(10).pow(new BN(config.ciety_decimals)));
    ixs.push(Token.createMintToInstruction(
        splToken.TOKEN_PROGRAM_ID,
        ciety_mint.publicKey,
        ciety_pubkey,
        initAccount.publicKey,
        [],
        amount.toArray("ge", 8)
    ));
    console.log('ciety_account_addr: ' + ciety_pubkey.toString());
    genearted['ciety_account_addr'] = ciety_pubkey.toString();

    // 4. Transfer to community
    let ciety_account_community = await ciety_mint.getOrCreateAssociatedAccountInfo(new PublicKey(config.to_community_address));
    ixs.push(splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        ciety_pubkey,
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
            ciety_pubkey,
            ciety_account_team_member.address,
            initAccount.publicKey,
            [],
            calc_amount(amount, avg_percent).toArray("ge", 8),
        ));
        console.log('ciety_account_team_member address: ' + ciety_account_team_member.address.toString());
    }

    // // 6. Create an account for holding config info
    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: config_pubkey,
        basePubkey: initAccount.publicKey,
        seed: config.seed_config,
        lamports: await connection.getMinimumBalanceForRentExemption(config.config_size, 'singleGossip'),
        space: config.config_size,
        programId: token_program_pubkey
    }));

    // 7. Create an account for Gsdm
    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: gsdm_pubkey,
        basePubkey: initAccount.publicKey,
        seed: config.seed_gsdm,
        lamports: await connection.getMinimumBalanceForRentExemption(config.gsdm_size, 'singleGossip'),
        space: config.gsdm_size,
        programId: stake_program_pubkey
    }));

    // 8. Create an account for Gcdm
    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: gcdm_pubkey,
        basePubkey: initAccount.publicKey,
        seed: config.seed_gcdm,
        lamports: await connection.getMinimumBalanceForRentExemption(config.gcdm_size, 'singleGossip'),
        space: config.gcdm_size,
        programId: stake_program_pubkey
    }));

    // 9. Create an account for Rpdm

    ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: initAccount.publicKey,
        newAccountPubkey: rpdm_pubkey,
        basePubkey: initAccount.publicKey,
        seed: config.seed_rpdm,
        lamports: await connection.getMinimumBalanceForRentExemption(config.rpdm_size, 'singleGossip'),
        space: config.rpdm_size,
        programId: stake_program_pubkey
    }));
    let tx = new Transaction().add(...ixs);
    tx.feePayer = initAccount.publicKey;
    tx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    await connection.sendTransaction(tx, [initAccount], { skipPreflight: false, preflightCommitment: 'confirmed' });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 10. Call solmate_program_token smart contract, transaction size has a limit of 1232 bytes
    //     it's good to start another transaction
    ixs = []
    let data = Uint8Array.of(0,
        ...new BN(config.stake_min_days).toArray("le", 2),
        ...new BN(config.stake_max_days).toArray("le", 2),
        ...new BN(config.emission_total_days).toArray("le", 2),
        ...new BN(config.ciety_decimals).toArray("le", 1),
        ...new BN(config.start_emission).toArray("le", 4),
        ...new BN(config.decay_frequency_seconds).toArray("le", 4),
        ...new BN(config.total_nfts).toArray("le", 2),
        ...new BN(config.max_stake_per_wallet).toArray("le", 2),
        ...new BN(config.max_stake_each_time).toArray("le", 2),
        ...new BN(config.nft_authors.length).toArray("le", 1),
        ...new BN(config.pwdm_size).toArray("le", 2),
        ...new BN(config.unstake_batch_size).toArray("le", 1),
        ...new BN(config.seed_pwdm.length).toArray("le", 1),
        ...new TextEncoder().encode(config.seed_pwdm),
        ...new BN(config.seed_pda_ciety.length).toArray("le", 1),
        ...new TextEncoder().encode(config.seed_pda_ciety),
        ...new BN(config.seed_pda_nft.length).toArray("le", 1),
        ...new TextEncoder().encode(config.seed_pda_nft));
    /**
        let acc_init = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_ciety_holder = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;
        let acc_ciety_mint = next_account_info(account_iter)?;
        let acc_gsdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_rpdm = next_account_info(account_iter)?;
     */
    let keys = [
        { pubkey: initAccount.publicKey, isSigner: true, isWritable: false },
        { pubkey: config_pubkey, isSigner: false, isWritable: true },
        { pubkey: ciety_pubkey, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: ciety_mint.publicKey, isSigner: false, isWritable: false },
        { pubkey: gsdm_pubkey, isSigner: false, isWritable: false },
        { pubkey: gcdm_pubkey, isSigner: false, isWritable: false },
        { pubkey: rpdm_pubkey, isSigner: false, isWritable: false },
    ];

    config.nft_authors.map(addr => {
        keys.push({ pubkey: new PublicKey(addr), isSigner: false, isWritable: false })
    })

    ixs.push(new TransactionInstruction({
        programId: token_program_pubkey,
        keys: keys,
        data: Buffer.from(data)
    }));

    tx = new Transaction().add(...ixs);
    tx.feePayer = initAccount.publicKey;
    tx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    await connection.sendTransaction(tx, [initAccount], { skipPreflight: false, preflightCommitment: 'confirmed' });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const on_chain_config = await read_config();
    console.log('on_chain_config===', on_chain_config);

    fs.writeFileSync('generated.json', JSON.stringify(genearted))
}

init().then(a => {

});