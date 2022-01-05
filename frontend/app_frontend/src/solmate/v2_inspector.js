import * as DATA_LAYOUT from "./v2_data_layout";
import { config } from './v2_config';
import { Connection, programs } from '@metaplex/js';
import { PublicKey } from "@solana/web3.js";

const connection = new Connection('devnet');

const host_pubkey = new PublicKey(config.host_wallet_addr);
const token_program_pubkey = new PublicKey(config.token_program_addr);

var CONFIG_DM = null

const get_curr_slot = async () => {
    let config_dm = await read_config()
    let rtn = Math.floor((new Date().getTime() / 1000 - new Date(config_dm.init_timestamp).getTime() / 1000) / config_dm.decay_frequency_seconds)
    return rtn
}

export const read_config = async () => {
    if(CONFIG_DM) return CONFIG_DM
    const config_pubkey = await PublicKey.createWithSeed(
        host_pubkey,
        config.seed_config,
        token_program_pubkey)
    const config_raw = (await connection.getAccountInfo(config_pubkey, 'confirmed')).data
    let config_dm = DATA_LAYOUT.CONFIG.decode(config_raw)
    let rtn = {
        is_initialized: config_dm.is_initialized ? true : false,
        init_pubkey: new PublicKey(config.host_wallet_addr).toString(),
        ciety_pubkey: new PublicKey(config_dm.ciety_pubkey).toString(),
        ciety_mint_pubkey: new PublicKey(config_dm.ciety_mint_pubkey).toString(),
        gsdm_pubkey: new PublicKey(config_dm.gsdm_pubkey).toString(),
        gcdm_pubkey: new PublicKey(config_dm.gcdm_pubkey).toString(),
        rpdm_pubkey: new PublicKey(config_dm.rpdm_pubkey).toString(),        
        pwdm_size: config_dm.pwdm_size,
        stake_min_days: config_dm.stake_min_days,
        stake_max_days: config_dm.stake_max_days,
        emission_total_days: config_dm.emission_total_days,
        ciety_decimals: config_dm.ciety_decimals,
        start_emission: config_dm.start_emission,
        init_timestamp: new Date(config_dm.init_timestamp * 1000).toISOString(),
        decay_frequency_seconds: config_dm.decay_frequency_seconds,
        end_slot: config_dm.end_slot,
        nft_author_cnt: config_dm.nft_author_cnt,
        total_nfts: config_dm.total_nfts,
        max_stake_per_wallet: config_dm.max_stake_per_wallet,
        max_stake_each_time: config_dm.max_stake_each_time,
        unstake_batch_size: config_dm.unstake_batch_size,
    }

    let ind = DATA_LAYOUT.CONFIG.span
    rtn['nft_authors'] = []
    for (var i = 0; i < rtn.nft_author_cnt; i++) {
        let slice = config_raw.slice(ind, ind + DATA_LAYOUT.CONFIG_REPEATED.span)
        let auth_pubkey = new PublicKey(DATA_LAYOUT.CONFIG_REPEATED.decode(slice).nft_author)
        rtn['nft_authors'].push(auth_pubkey.toString())
        ind = ind + DATA_LAYOUT.CONFIG_REPEATED.span
    }

    ind = DATA_LAYOUT.CONFIG.span + 10 * DATA_LAYOUT.CONFIG_REPEATED.span
    let obj = {ind:ind, raw:config_raw}
    let seed_pwdm = next_string(obj)
    let seed_pda_ciety = next_string(obj)
    let seed_pda_nft = next_string(obj)
    rtn['seed_pwdm'] = seed_pwdm
    rtn['seed_pda_ciety'] = seed_pda_ciety
    rtn['seed_pda_nft'] = seed_pda_nft

    CONFIG_DM = rtn
    return CONFIG_DM
}

const next_string = (obj) => {
    let len = obj.raw.slice(obj.ind, obj.ind + 1)[0]
    obj.ind = obj.ind + 1
    let str = obj.raw.slice(obj.ind, obj.ind + len).toString()
    obj.ind = obj.ind + len
    return str
  }

export const read_pwdm = async (stake_wallet) => {
    let config_dm = await read_config()
    let stake_program_pubkey = new PublicKey(config.stake_program_addr)
    let staker_wallet_pubkey = new PublicKey(stake_wallet)

    const pwdm_pubkey = await PublicKey.createWithSeed(
        staker_wallet_pubkey,
        config_dm.seed_pwdm,
        stake_program_pubkey)
        
    const pwdm_raw = (await connection.getAccountInfo(pwdm_pubkey, 'confirmed')).data

    let ind = 0
    let slice = pwdm_raw.slice(ind, ind + DATA_LAYOUT.PWDM_HEAD.span)
    let pwdm_head = DATA_LAYOUT.PWDM_HEAD.decode(slice)
    let rtn = {
        is_initialized: pwdm_head.is_initialized ? true : false,
        ciety: pwdm_head.ciety,
        nft_count: pwdm_head.nft_count,
        unstake_start: pwdm_head.unstake_start,
        repeated: []
    }
    ind = ind + DATA_LAYOUT.PWDM_HEAD.span

    for (var i = 0; i < pwdm_head.nft_count; i++) {
        slice = pwdm_raw.slice(ind, ind + DATA_LAYOUT.PWDM_REPEATED.span)
        let pwdm_repeated = DATA_LAYOUT.PWDM_REPEATED.decode(slice)
        rtn.repeated.push({
            nft_account: new PublicKey(pwdm_repeated.nft_account).toBase58(),
            nft_mint: new PublicKey(pwdm_repeated.nft_mint).toBase58(),
            nft_nth: pwdm_repeated.nft_nth,
            start_timestamp: new Date(pwdm_repeated.start_timestamp * 1000).toISOString(),
            time_length_days: pwdm_repeated.time_length_days,
        })
        ind = ind + DATA_LAYOUT.PWDM_REPEATED.span
    }
    return rtn
}

export const read_gcdm = async () => {
    let config_dm = await read_config()
    const gcdm_raw = (await connection.getAccountInfo(new PublicKey(config_dm.gcdm_pubkey), 'confirmed')).data

    let ind = 0
    let slice = gcdm_raw.slice(ind, ind + DATA_LAYOUT.GCDM_HEAD.span)
    let gcdm_head = DATA_LAYOUT.GCDM_HEAD.decode(slice)
    let rtn = {
        is_initialized: gcdm_head.is_initialized ? true : false,
        last_calc_slot: gcdm_head.last_calc_slot,
        global_nft_count: gcdm_head.global_nft_count,
        repeated: []
    }
    ind = ind + DATA_LAYOUT.GCDM_HEAD.span

    for (var i = 0; i < rtn.global_nft_count; i++) {
        slice = gcdm_raw.slice(ind, ind + DATA_LAYOUT.GCDM_REPEATED.span)
        let gcdm_repeated = DATA_LAYOUT.GCDM_REPEATED.decode(slice)
        rtn.repeated.push({
            nft_ciety: gcdm_repeated.nft_ciety,
            start_slot: gcdm_repeated.start_slot,
            end_slot: gcdm_repeated.end_slot,
        })
        ind = ind + DATA_LAYOUT.GCDM_REPEATED.span
    }
    return rtn
}

export const read_gsdm = async () => {
    let config_dm = await read_config()
    let gsdm_raw = (await connection.getAccountInfo(new PublicKey(config_dm.gsdm_pubkey), 'confirmed')).data

    // Read Gsdm head
    let ind = 0
    let slice = gsdm_raw.slice(ind, ind + DATA_LAYOUT.GSDM_HEAD.span)
    let gsdm_head = DATA_LAYOUT.GSDM_HEAD.decode(slice)
    let rtn = {
        is_initialized: gsdm_head.is_initialized ? true : false,
        repeated: []
    }
    ind = ind + DATA_LAYOUT.GSDM_HEAD.span

    // Read Gsdm slots down to curr_slot, rather than to 365
    let curr_slot = await get_curr_slot()
    console.log('curr_slot===', curr_slot)
    for (var slot = 0; slot < curr_slot; slot++) {
        slice = gsdm_raw.slice(ind, ind + DATA_LAYOUT.GSDM_REPEATED.span)
        let gsdm_repeated = DATA_LAYOUT.GSDM_REPEATED.decode(slice)

        // Read nft_nth only down to last_ind, rather than to 7000
        let nft_nths = []
        for (var j = 0; j <= gsdm_repeated.nft_last_ind; j++) {
            if (gsdm_repeated.nft_nth[j] == 1) {
                nft_nths.push(j)
            }
        }

        // Organize the repeated segment
        if (nft_nths.length > 0) {
            let tmp = {
                slot: slot,
                nft_count: gsdm_repeated.nft_count,
                nft_last_ind: gsdm_repeated.nft_last_ind,
                nft_nths: '[' + nft_nths.toString() + ']'
            }
            rtn.repeated.push(tmp)
        } else {
            // ignore empty slot
        }

        ind = ind + DATA_LAYOUT.GSDM_REPEATED.span
    }
    return rtn
}

export const read_rpdm = async () => {
    let config_dm = await read_config()
    const rpdm_raw = (await connection.getAccountInfo(new PublicKey(config_dm.rpdm_pubkey), 'confirmed')).data

    let ind = 0
    let slice = rpdm_raw.slice(ind, ind + DATA_LAYOUT.RPDM_HEAD_LENGTH)
    let rpdm_head = DATA_LAYOUT.RPDM_HEAD.decode(slice)
    let rtn = {
        is_initialized: rpdm_head.is_initialized ? true : false,
        count_to_calc: rpdm_head.count_to_calc,
        repeated: []
    }
    ind = ind + DATA_LAYOUT.RPDM_HEAD_LENGTH

    for (var i = 0; i < rtn.count_to_calc; i++) {
        slice = rpdm_raw.slice(ind, ind + DATA_LAYOUT.RPDM_REPEATED_LENGTH)
        let rpdm_repeated = DATA_LAYOUT.RPDM_REPEATED.decode(slice)
        rtn.repeated.push({
            slot_nth: rpdm_repeated.slot_nth,
            nft_nth: rpdm_repeated.nft_nth,
        })
        ind = ind + DATA_LAYOUT.RPDM_REPEATED_LENGTH
    }
    return rtn
}
