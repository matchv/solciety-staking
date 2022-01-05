const { SystemProgram, clusterApiUrl, Keypair, Account, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } = require("@solana/web3.js");
const { AccountLayout, Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const BN = require('bn.js');
const  BufferLayout = require('buffer-layout');

const { read_config } = require("./v2_layout");
const { config } = require('./v2_config');
const host_wallet = require('./host_wallet.json');

const connection = new Connection(
    clusterApiUrl(config.network),
    'confirmed',
);

const stake_program_pubkey = new PublicKey(config.stake_program_addr)
const token_program_pubkey = new PublicKey(config.token_program_addr)
const secretKey = Buffer.from(host_wallet);
const initAccount = Keypair.fromSecretKey(secretKey);
const host_pubkey = initAccount.publicKey

const get_curr_slot = async () => {
    let config_dm = await read_config()
    let rtn = Math.floor((new Date().getTime() / 1000 - new Date(config_dm.init_timestamp).getTime() / 1000) / config_dm.decay_frequency_seconds)
    return rtn
}

const prep_reward_calc = async (config_dm) => {
    const rpdm_pubkey = new PublicKey(config_dm.rpdm_pubkey)
    const gcdm_pubkey = new PublicKey(config_dm.gcdm_pubkey)
    const gsdm_pubkey = new PublicKey(config_dm.gsdm_pubkey)
    const config_pubkey = await PublicKey.createWithSeed(
        host_pubkey,
        config.seed_config,
        token_program_pubkey)

    // let acc_init = next_account_info(account_iter)?;
    // let acc_rpdm = next_account_info(account_iter)?;
    // let acc_gcdm = next_account_info(account_iter)?;
    // let acc_gsdm = next_account_info(account_iter)?;
    // let acc_config = next_account_info(account_iter)?;
    let curr_slot = await get_curr_slot()
    let data_reward_prep = Uint8Array.of(5,
        ...new BN(curr_slot).toArray("le", 2))
    let keys_reward_prep = [
        { pubkey: host_pubkey, isSigner: true, isWritable: true },
        { pubkey: rpdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: gcdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: gsdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: config_pubkey, isSigner: false, isWritable: false },
        { pubkey: token_program_pubkey, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ]

    let ixs_reward_prep = []
    ixs_reward_prep.push(new TransactionInstruction({
        programId: stake_program_pubkey,
        keys: keys_reward_prep,
        data: Buffer.from(data_reward_prep)
    }))

    const tx_reward_prep = new Transaction().add(...ixs_reward_prep)
    tx_reward_prep.feePayer = host_pubkey
    tx_reward_prep.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    await connection.sendTransaction(tx_reward_prep, [initAccount], { skipPreflight: false, preflightCommitment: 'confirmed' })
    await new Promise(f=>setTimeout(f, 2000))
}

/**
 * is_initialized, 1 byte
 * count_to_calc,  2 bytes
 * ===below repeated==
 * slot_nth,       2 bytes
 * nft_nth,        2 bytes
 */
const RPDM_HEAD_LENGTH = 3
const RPDM_REPEATED_LENGTH = 4
const RPDM_HEAD = BufferLayout.struct([
    BufferLayout.u8('is_initialized'),
    BufferLayout.u16('count_to_calc'),
]);
const RPDM_REPEATED = BufferLayout.struct([
    BufferLayout.u16('slot_nth'),
    BufferLayout.u16('nft_nth'),
]);
const read_rpdm = async (config_dm) => {
    const rpdm_pubkey = new PublicKey(config_dm.rpdm_pubkey)
    const rpdm_raw = (await connection.getAccountInfo(rpdm_pubkey, 'confirmed')).data

    let ind = 0
    let slice = rpdm_raw.slice(ind, ind + RPDM_HEAD_LENGTH)
    let rpdm_head = RPDM_HEAD.decode(slice)
    let rtn = {
        is_initialized: rpdm_head.is_initialized ? true : false,
        count_to_calc: rpdm_head.count_to_calc,
        repeated: []
    }
    ind = ind + RPDM_HEAD_LENGTH

    for (var i = 0; i < rtn.count_to_calc; i++) {
        slice = rpdm_raw.slice(ind, ind + RPDM_REPEATED_LENGTH)
        let rpdm_repeated = RPDM_REPEATED.decode(slice)
        rtn.repeated.push({
            slot_nth: rpdm_repeated.slot_nth,
            nft_nth: rpdm_repeated.nft_nth,
        })
        ind = ind + RPDM_REPEATED_LENGTH
    }
    return rtn
}


const reward = async () => {
    let config_dm = await read_config()
    const gcdm_pubkey = new PublicKey(config_dm.gcdm_pubkey)
    const gsdm_pubkey = new PublicKey(config_dm.gsdm_pubkey)
    const config_pubkey = await PublicKey.createWithSeed(
        host_pubkey,
        config.seed_config,
        token_program_pubkey)

    let keys = [
        { pubkey: host_pubkey, isSigner: true, isWritable: true },
        { pubkey: gcdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: gsdm_pubkey, isSigner: false, isWritable: true },
        { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: config_pubkey, isSigner: false, isWritable: false },
        { pubkey: token_program_pubkey, isSigner: false, isWritable: false },
    ]

    while(true){
        try{
            await prep_reward_calc(config_dm)
            let rpdm = await read_rpdm(config_dm)
            console.log('rpdm.count_to_calc====', rpdm.count_to_calc)
            for (var i = 0; i < rpdm.count_to_calc; i++) {
                let slot_task = rpdm.repeated[i]
                let last_nft_nth = 0
                while (true) {
                    let stop = false
                    let next_nft_nth = last_nft_nth + 1000
                    if (next_nft_nth >= slot_task.nft_nth) {
                        next_nft_nth = slot_task.nft_nth
                        stop = true
                    }
        
                    let ixs = []
                    let data = Uint8Array.of(1,
                        ...new BN(last_nft_nth).toArray("le", 2),
                        ...new BN(next_nft_nth).toArray("le", 2),
                        ...new BN(slot_task.slot_nth).toArray("le", 2))
                    console.log('slot_nth', slot_task.slot_nth)
                    ixs.push(new TransactionInstruction({
                        programId: stake_program_pubkey,
                        keys: keys,
                        data: Buffer.from(data)
                    }))
        
                    const tx = new Transaction().add(...ixs)
                    tx.feePayer = host_pubkey
                    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
        
                    await connection.sendTransaction(tx, [initAccount], { skipPreflight: false, preflightCommitment: 'confirmed' })
                    await new Promise(f=>setTimeout(f, 50))
                    if(stop)break
                    last_nft_nth = next_nft_nth
                }
            }
            await new Promise(f=>setTimeout(f, config.decay_frequency_seconds*1000))
        }catch(err){
            console.log(err)
        }
    }
}

reward().then();