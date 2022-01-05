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
    const secretKey = Buffer.from(host_wallet);
    const initAccount = Keypair.fromSecretKey(secretKey);
    const token_program_pubkey = new PublicKey(config.token_program_addr);

    const PDA_config = await PublicKey.createWithSeed(
        initAccount.publicKey,
        config.seed_config,
        token_program_pubkey);

    const encodedConfigAccountState = (await connection.getAccountInfo(PDA_config, 'confirmed')).data;
    const decodedConfigAccountState = CONFIG_ACCOUNT_DATA_LAYOUT.decode(encodedConfigAccountState);
    console.log('decodedConfigAccountState===', decodedConfigAccountState);
    console.log('init_pubkey===', new PublicKey(decodedConfigAccountState.init_pubkey).toString());
}

init().then(a => {

});