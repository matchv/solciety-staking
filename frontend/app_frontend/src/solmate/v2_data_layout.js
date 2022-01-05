import  BufferLayout from 'buffer-layout';
import {config} from './v2_config';

/**
 * =========Config head, 228 bytes=============
 * is_initialized,          1 byte
 * init_pubkey,             32 bytes
 * ciety_pubkey,            32 bytes
 * ciety_mint_pubkey,       32 bytes
 * gsdm_pubkey,             32 bytes
 * gcdm_pubkey,             32 bytes
 * rpdm_pubkey,             32 bytes
 * pwdm_size,               2 bytes
 * stake_min_days,          2 bytes
 * stake_max_days,          2 bytes
 * emission_total_days,     2 bytes
 * ciety_decimals,          1 byte
 * start_emission,          4 bytes
 * init_timestamp,          8 bytes
 * decay_frequency_seconds, 4 bytes
 * end_slot,                2 bytes
 * nft_author_cnt,          1 byte
 * total_nfts,              2 bytes
 * max_stake_per_wallet,    2 bytes
 * max_stake_each_time,     2 bytes
 * unstake_batch_size,      1 byte
 * ===below repeated===============
 * nft_author,              32 bytes
 */
export const CONFIG = BufferLayout.struct([
  BufferLayout.u8('is_initialized'),
  BufferLayout.blob(32, 'init_pubkey'),
  BufferLayout.blob(32, 'ciety_pubkey'),
  BufferLayout.blob(32, 'ciety_mint_pubkey'),
  BufferLayout.blob(32, 'gsdm_pubkey'),
  BufferLayout.blob(32, 'gcdm_pubkey'),
  BufferLayout.blob(32, 'rpdm_pubkey'),
  BufferLayout.u16('pwdm_size'),
  BufferLayout.u16('stake_min_days'),
  BufferLayout.u16('stake_max_days'),
  BufferLayout.u16('emission_total_days'),
  BufferLayout.u8('ciety_decimals'),
  BufferLayout.u32('start_emission'),
  BufferLayout.nu64('init_timestamp'),
  BufferLayout.u32('decay_frequency_seconds'),
  BufferLayout.u16('end_slot'),
  BufferLayout.u8('nft_author_cnt'),
  BufferLayout.u16('total_nfts'),
  BufferLayout.u16('max_stake_per_wallet'),
  BufferLayout.u16('max_stake_each_time'),
  BufferLayout.u8('unstake_batch_size'),
]);

export const CONFIG_REPEATED = BufferLayout.struct([
  BufferLayout.blob(32, 'nft_author'),
]);

/**
 * is_initialized, 1 byte
 * ciety, 8 bytes
 * nft_count, 2 bytes
 * unstake_start, 2 bytes
 * ===below repeated==
 * nft_account, 32 bytes
 * nft_mint, 32 bytes
 * nft_nth, 2 bytes
 * start_timestamp, 8 bytes
 * time_length_days, 2 bytees
 */
export const PWDM_HEAD = BufferLayout.struct([
  BufferLayout.u8('is_initialized'),
  BufferLayout.f64('ciety'),
  BufferLayout.u16('nft_count'),
  BufferLayout.u16('unstake_start'),
]);

export const PWDM_REPEATED = BufferLayout.struct([
  BufferLayout.blob(32, 'nft_account'),
  BufferLayout.blob(32, 'nft_mint'),
  BufferLayout.u16('nft_nth'),
  BufferLayout.nu64('start_timestamp'),
  BufferLayout.u16('time_length_days'),
]);

/**
* is_initialized,   1 byte
* last_stake_slot,  2 bytes
* last_calc_slot,   2 bytes
* global_nft_count, 2 bytes
* ===below repeated==
* nft_ciety,  8 bytes
* start_slot, 2 bytes
* end_slot,   2 bytees
*/
export const GCDM_HEAD = BufferLayout.struct([
  BufferLayout.u8('is_initialized'),
  BufferLayout.u16('last_calc_slot'),
  BufferLayout.u16('global_nft_count'),
]);
export const GCDM_REPEATED = BufferLayout.struct([
  BufferLayout.nu64('nft_ciety'),
  BufferLayout.u16('start_slot'),
  BufferLayout.u16('end_slot'),
]);

/**
* is_initialized, 1 byte
* ===below repeated per slot==
* nft_count, 2 bytes
* nft_last_ind, 2 bytes
* nft_nth,   1 bytes, 7000 bytes in total
*/
export const GSDM_HEAD = BufferLayout.struct([
  BufferLayout.u8('is_initialized'),
]);
export const GSDM_REPEATED = BufferLayout.struct([
  BufferLayout.u16('nft_count'),
  BufferLayout.u16('nft_last_ind'),
  BufferLayout.blob(config.total_nfts, 'nft_nth'),
]);


/**
 * is_initialized, 1 byte
 * count_to_calc,  2 bytes
 * ===below repeated==
 * slot_nth,       2 bytes
 * nft_nth,        2 bytes
 */
export const RPDM_HEAD_LENGTH = 3
export const RPDM_REPEATED_LENGTH = 4
export const RPDM_HEAD = BufferLayout.struct([
  BufferLayout.u8('is_initialized'),
  BufferLayout.u16('count_to_calc'),
]);
export const RPDM_REPEATED = BufferLayout.struct([
  BufferLayout.u16('slot_nth'),
  BufferLayout.u16('nft_nth'),
]);

